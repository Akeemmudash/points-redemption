import { cn } from "@/lib/utils";

export function StatusBadge({ status }) {
  const normalized = String(status).toLowerCase();
  
  let styles = "bg-secondary text-secondary-foreground";
  
  if (normalized === "successful" || normalized === "active") {
    styles = "bg-status-success-bg text-status-success";
  } else if (normalized === "failed" || normalized === "inactive") {
    styles = "bg-status-failed-bg text-status-failed";
  } else if (normalized === "pending") {
    styles = "bg-status-pending-bg text-status-pending";
  }

  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[13px] font-semibold select-none shrink-0 tracking-wide font-sans",
        styles
      )}
    >
      {label}
    </span>
  );
}
