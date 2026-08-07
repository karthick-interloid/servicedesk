import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current",
      },
      /* ADDITIVE — components-map.md row 64. Stock ships only default/destructive; the
         design needs five tones sharing Badge's soft/strong pairs (treatments §3.4).
         Colour enters through tokens only: the design's *markup* draws the success alert
         with green-50/green-200/--primary, but its own snippet writes the token form
         `border-<tone>/25 bg-<tone>-soft text-<tone>-strong`, and map rule 4 forbids
         palette classes in an app primitive. Snippet form taken — logged as a
         design-ambiguity in the difference list. */
      tone: {
        info: "border-info/25 bg-info-soft text-info-strong *:data-[slot=alert-description]:text-current *:[svg]:text-current",
        success:
          "border-success/25 bg-success-soft text-success-strong *:data-[slot=alert-description]:text-current *:[svg]:text-current",
        warning:
          "border-warning/25 bg-warning-soft text-warning-strong *:data-[slot=alert-description]:text-current *:[svg]:text-current",
        error:
          "border-destructive/25 bg-destructive-soft text-destructive-strong *:data-[slot=alert-description]:text-current *:[svg]:text-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2 right-2", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
