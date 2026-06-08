import { formatDate, formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function DateText({ value, relative = false, className }) {
  if (!value) {
    return <span className={cn("text-muted-foreground", className)}>—</span>;
  }

  if (relative) {
    return (
      <span className={cn("inline-flex flex-col gap-0.5", className)}>
        <span className="text-foreground">{formatDate(value)}</span>
        <span className="text-xs text-muted-foreground font-sans">
          {formatRelativeDate(value)}
        </span>
      </span>
    );
  }

  return <span className={cn("font-sans", className)}>{formatDate(value)}</span>;
}
