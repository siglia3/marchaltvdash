import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-[14px] border border-white/5 bg-white/[0.03] px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-primary/60 focus:bg-white/[0.05]",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
