import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "blue" | "green" | "yellow" | "red" | "gray";

const toneClasses: Record<BadgeTone, string> = {
  blue: "bg-primary/16 text-primary",
  green: "bg-success/16 text-success",
  yellow: "bg-warning/16 text-warning",
  red: "bg-danger/16 text-danger",
  gray: "bg-slate-500/12 text-slate-300"
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({
  className,
  tone = "blue",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold tracking-[-0.01em]",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
