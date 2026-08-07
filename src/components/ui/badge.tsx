import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { toneClass, toneDot, type Tone } from "@/lib/badge-tones"
import { cn } from "@/lib/utils"

/* ADDITIVE EXTENSIONS — components-map.md rows 43, 44, 45. The stock `variant` group is
   untouched; `tone`, `size` and the `dot` prop are new. Reasons:

   tone (neutral|brand|info|success|warning|error)
     Row 43. The starter badge is variant-based with an alpha-soft destructive and no
     ring; the design is tone-based on a soft-surface + strong-text + `ring-<tone>/25`
     inset recipe across six tones (treatments §3.1). The class strings come from
     `lib/badge-tones.ts` so rule 5's single source is literal, not just intended.
     Declared AFTER `variant` so tailwind-merge resolves tone over the variant default.

   size.count / .count-sm
     Row 45. The nav count pill is a 20px mono circle; the unread bell is 16px and uses
     `text-[10px]` — one of the design's four sanctioned arbitrary values, because the
     12px floor will not fit a 16px circle.

   interactive / removable
     Row 44. Tags are the interactive form of the same recipe; Badge itself stays
     read-only per the design's own API note.

   dot
     Row 43. Leading dot, filled from the tone's base value. */

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      tone: toneClass,
      size: {
        default: "",
        count: "h-5 min-w-5 justify-center rounded-full px-1.5 font-mono font-bold",
        "count-sm":
          "h-4 min-w-4 justify-center rounded-full px-1 font-mono text-[10px] font-bold",
        tag: "h-7 rounded-full px-3",
      },
      interactive: {
        true: "cursor-pointer transition-colors duration-200 ease-out",
      },
      removable: { true: "gap-1.5 pr-1.5" },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  tone,
  size = "default",
  interactive,
  removable,
  dot = false,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"span"> &
  Omit<VariantProps<typeof badgeVariants>, "tone"> & {
    asChild?: boolean
    tone?: Tone
    dot?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      {...(tone ? { "data-tone": tone } : {})}
      className={cn(
        badgeVariants({ variant, tone, size, interactive, removable }),
        className
      )}
      {...props}
    >
      {dot && tone ? (
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", toneDot[tone])}
        />
      ) : null}
      {children}
    </Comp>
  )
}

export { Badge, badgeVariants }
