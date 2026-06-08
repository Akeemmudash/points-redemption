import { cn } from "@/lib/utils";

export function PageHeader({ title, description, children, className }) {
  return (
    <div className={cn("flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-border", className)}>
      <div className="space-y-1">
        <h1 className="font-display font-semibold text-[28px] leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground font-sans">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 mt-4 md:mt-0 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
