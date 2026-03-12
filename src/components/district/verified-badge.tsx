import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs text-cta",
        className
      )}
    >
      <CheckCircle className="size-3.5" />
      Verified
    </span>
  );
}
