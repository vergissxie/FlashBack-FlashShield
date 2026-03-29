import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        /** 主 CTA：白金风拉丝金按钮，轻微高光扫过 */
        hero: "relative overflow-hidden rounded-xl px-8 py-3 text-base font-semibold text-[#001F5B] shadow-[0_10px_26px_rgba(0,31,91,0.12)] ring-1 ring-[#C5A059]/45 bg-[linear-gradient(135deg,#F4E7CC_0%,#E0C489_40%,#C5A059_100%)] transition-all duration-300 hover:brightness-105 hover:shadow-[0_12px_34px_rgba(197,160,89,0.35)] hover:ring-[#C5A059] active:scale-[0.98]",
        /** 次要：精密仪表玻璃态 */
        heroSecondary:
          "rounded-xl border border-[#001F5B]/20 bg-white/65 px-8 py-3 text-base font-medium text-[#001F5B]/85 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-all duration-300 hover:border-[#C5A059]/60 hover:text-[#001F5B] hover:shadow-[0_0_0_1px_rgba(197,160,89,0.2),0_10px_22px_rgba(0,31,91,0.08)] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        hero: "min-h-[52px] px-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
  },
)
Button.displayName = "Button"

export { Button }
