"use client"

import * as React from "react"
import type { Label as LabelPrimitive } from "radix-ui"
import { Slot } from "radix-ui"
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/**
 * shadcn/ui `form` — the react-hook-form bindings.
 *
 * NOT installed by the CLI: this project's style is `radix-nova` (components.json), and
 * `https://ui.shadcn.com/r/styles/radix-nova/form.json` ships an EMPTY registry item, so
 * `npx shadcn add form` exits 2 without writing anything. The file below is the upstream
 * `new-york-v4` source with four deliberate deviations, all of them so this project's
 * design decisions survive. Re-adding from the CLI later would drop them — diff first.
 *
 *  1. `FormItem` accepts an explicit `id` and seeds the field's ids from it:
 *     `<FormItem id="login-email">` gives the control `#login-email`, the hint
 *     `#login-email-hint` and the error `#login-email-error`. That is the id convention
 *     every auth screen and its Playwright spec already use. Without an `id` the
 *     generated `useId()` and upstream's `-form-item*` suffixes are used unchanged. The
 *     id is consumed by the context, not put on the wrapper `<div>` — it belongs to the
 *     control.
 *  2. `FormDescription` yields to the error instead of stacking under it. Every screen's
 *     capture shows the error REPLACING the hint (docs/SIGNUP-ACCOUNT-DIFF.md, and the
 *     same note in each form), so that rule lives in the primitive rather than being
 *     re-implemented at nine call sites.
 *  3. Following from 2, `FormControl` points `aria-describedby` at ONE id — the error when
 *     there is one, the hint otherwise — and at nothing when the field has no hint.
 *     Upstream always names both ids, which would dangle here now that the hint unmounts.
 *  4. `FormLabel` keeps its `data-error` attribute but not upstream's
 *     `data-[error=true]:text-destructive`, and `FormMessage` paints
 *     `text-destructive-strong` rather than `text-destructive`. The design does not
 *     recolour labels in the error state, and `--destructive-strong` is this project's
 *     error-text token (docs/treatments.md §error, 5.9:1 AA).
 */

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id, named, hasDescription, setHasDescription } = itemContext

  return {
    id,
    name: fieldContext.name,
    // Deviation 1: a caller-supplied id owns its own suffixes.
    formItemId: named ? id : `${id}-form-item`,
    formDescriptionId: named ? `${id}-hint` : `${id}-form-item-description`,
    formMessageId: named ? `${id}-error` : `${id}-form-item-message`,
    hasDescription,
    setHasDescription,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
  /** True when `id` came from the caller, so the project's suffixes apply. */
  named: boolean
  /** Whether a `FormDescription` is mounted, so `aria-describedby` can stay honest. */
  hasDescription: boolean
  setHasDescription: (present: boolean) => void
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

function FormItem({ className, id, ...props }: React.ComponentProps<"div">) {
  const generatedId = React.useId()
  const [hasDescription, setHasDescription] = React.useState(false)

  const context = React.useMemo(
    () => ({
      id: id ?? generatedId,
      named: id !== undefined,
      hasDescription,
      setHasDescription,
    }),
    [id, generatedId, hasDescription]
  )

  return (
    <FormItemContext.Provider value={context}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={className}
      htmlFor={formItemId}
      {...props}
    />
  )
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot.Root>) {
  const {
    error,
    formItemId,
    formDescriptionId,
    formMessageId,
    hasDescription,
  } = useFormField()

  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      // One id, and only one that is actually rendered — see deviation 3.
      aria-describedby={
        error ? formMessageId : hasDescription ? formDescriptionId : undefined
      }
      aria-invalid={!!error}
      {...props}
    />
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formDescriptionId, setHasDescription } = useFormField()

  // Registration is by MOUNT, not by visibility: the hint below still unmounts only when
  // the caller stops rendering it, so `hasDescription` stays true across an error state.
  React.useEffect(() => {
    setHasDescription(true)
    return () => setHasDescription(false)
  }, [setHasDescription])

  // Deviation 2: the error replaces the hint, it does not stack under it.
  if (error) {
    return null
  }

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : props.children

  if (!body) {
    return null
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-sm text-destructive-strong", className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
