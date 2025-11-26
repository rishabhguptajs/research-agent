import * as React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-none border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80":
            variant === "default",
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80":
            variant === "secondary",
          "border-transparent bg-red-900 text-red-100 shadow hover:bg-red-900/80":
            variant === "destructive",
          "text-foreground": variant === "outline",
          "border-transparent bg-green-900 text-green-100 hover:bg-green-900/80": variant === "success",
          "border-transparent bg-yellow-900 text-yellow-100 hover:bg-yellow-900/80": variant === "warning",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
