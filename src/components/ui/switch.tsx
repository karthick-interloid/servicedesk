"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/* ADDED, not edited — this file did not exist. `npx shadcn add switch` fails here
   (`ui.shadcn.com` unreachable, DIFFERENCE-LIST D-5), so the primitive is composed on
   `radix-ui`'s Switch, which is already a dependency. No new package.

   Closes DIFFERENCE-LIST A1 and components-map row 51.

   Metrics from docs/treatments.md line 298: track 44 × 24, thumb inset 2px, so the thumb
   is 20px and travels 20px. The checked fill is --brand-accent (the product accent every
   other surface paints from), not --primary: the prototype renders these teal.

   No dark rules: every colour is a semantic token, so dark follows the token set. */
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent p-0.5 transition-colors outline-none",
        "bg-input focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-checked:bg-brand-accent data-[state=checked]:bg-brand-accent",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-background shadow-xs ring-0 transition-transform",
          "translate-x-0 data-checked:translate-x-5 data-[state=checked]:translate-x-5"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
