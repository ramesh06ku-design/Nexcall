import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-white shadow-sm hover:bg-primary-strong",
        outline: "border border-border bg-white text-foreground hover:bg-muted",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        secondary: "bg-primary-soft text-primary-strong hover:bg-primary-soft/70",
        danger: "bg-red-600 text-white hover:bg-red-700",
      },
      size: { default: "h-11", sm: "h-9 rounded-lg px-3", lg: "h-12 px-6", icon: "size-10 px-0" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }

export function Button({ className, variant, size, asChild, children, ...props }: ButtonProps) {
  if (asChild) return <span className={cn(buttonVariants({ variant, size }), className)}>{children}</span>;
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props}>{children}</button>;
}

export { buttonVariants };
