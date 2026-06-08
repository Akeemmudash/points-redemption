import { Button } from "@/components/ui/button";

export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-card min-h-[320px] bg-background">
      <div className="max-w-[420px] space-y-4">
        <div className="space-y-1.5">
          <h3 className="font-display font-semibold text-lg text-foreground tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground font-sans leading-normal">
            {description}
          </p>
        </div>
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            className="rounded-full px-5 h-11 active:scale-95 text-[15px]"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
