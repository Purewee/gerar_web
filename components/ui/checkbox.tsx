import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            "relative h-4 w-4 rounded border-2 transition-all duration-200 flex items-center justify-center",
            checked
              ? "bg-primary border-primary shadow-sm"
              : "bg-white border-gray-300 hover:border-primary/50",
            "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-0",
            className
          )}
        >
          {checked && (
            <Check
              className="h-3 w-3 text-white"
              style={{
                animation: "fade-in 0.2s ease-out, zoom-in-75 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
              strokeWidth={3}
            />
          )}
        </div>
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
