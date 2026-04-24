import { cn } from "@/lib/utils";

export function Skeleton({
  className
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-[14px] bg-[linear-gradient(110deg,rgba(30,35,51,0.5),rgba(44,51,73,0.75),rgba(30,35,51,0.5))] bg-[length:200%_100%]",
        className
      )}
    />
  );
}
