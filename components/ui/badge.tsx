import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        // Semantic tones, see lib/status-styles.ts
        neutral: "border-transparent bg-secondary text-foreground",
        info: "border-transparent bg-info-subtle text-info-subtle-foreground",
        warning: "border-transparent bg-warning-subtle text-warning-subtle-foreground",
        success: "border-transparent bg-success-subtle text-success-subtle-foreground",
        destructive: "border-transparent bg-destructive-subtle text-destructive-subtle-foreground",
        highlight: "border-transparent bg-highlight-subtle text-highlight-subtle-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
