import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-105 transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-foreground text-text hover:bg-neon-purple border-2 border-neon-purple",
        happy: "bg-foreground text-text hover:bg-neon-green border-2 border-neon-green",
        neutral: "bg-foreground text-text hover:bg-neon-blue border-2 border-neon-blue",
        destructive:
          "bg-destructive text-text hover:bg-neon-red hover:scale-95 border-2 border-neon-red",
        return: "bg-foreground text-text hover:bg-neon-orange border-2 border-neon-orange",
        outline:
          "border border-input bg-background hover:bg-slate-600 hover:text-accent-foreground border-2 border-neon-green",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-neon-purple border-2 border-neon-purple",
        ghost: "hover:bg-accent hover:text-accent-foreground border-2 border-neon-orange",
        link: "text-foreground underline-offset-4 hover:underline border-2 border-neon-purple",
      },
      size: {
        default: "h-10 px-4 py-2 text-lg",
        sm: "h-9 rounded-md px-3 text-md",
        lg: "h-11 rounded-md px-8 text-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
