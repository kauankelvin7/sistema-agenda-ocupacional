
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 dark:focus:ring-blue-400",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 dark:bg-red-600 dark:text-white dark:hover:bg-red-700 dark:focus:ring-red-400",
        outline:
          "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-500 dark:focus:ring-blue-400",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:focus:ring-gray-400",
        ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:ring-gray-400",
        link: "text-blue-600 underline-offset-4 hover:underline focus:ring-blue-500 dark:text-blue-400 dark:hover:text-blue-300 dark:focus:ring-blue-400",
        success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-600 dark:text-white dark:hover:bg-green-700 dark:focus:ring-green-400",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 dark:bg-yellow-600 dark:text-white dark:hover:bg-yellow-700 dark:focus:ring-yellow-400",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        "mobile-sm": "h-8 px-2 py-1 text-xs",
        "mobile-friendly": "h-10 px-3 py-2 text-sm",
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
