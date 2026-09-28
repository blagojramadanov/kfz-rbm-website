import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        /** Brand accent CTA (hero, auth pages on the navy background). */
        accent: "bg-kfz-accent text-primary-foreground hover:bg-kfz-accent-hover",
        success: "bg-success text-success-foreground hover:bg-success-hover",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive-hover",
        outline:
          "border border-input bg-card text-foreground hover:bg-secondary",
        "outline-primary":
          "border border-primary bg-card text-primary hover:bg-primary hover:text-primary-foreground",
        "outline-destructive":
          "border border-destructive-border bg-card text-destructive hover:bg-destructive-subtle/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        /** Outline on the navy hero/header background. */
        "outline-inverse":
          "border border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary",
        /** White button on the navy hero/header background. */
        inverse: "bg-card text-primary hover:bg-secondary",
      },
      size: {
        // 44px touch targets on phones, the compact sizes from sm up
        default: "h-11 sm:h-10 px-4 py-2",
        sm: "h-11 sm:h-9 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11 sm:h-10 sm:w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
