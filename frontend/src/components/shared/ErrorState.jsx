import { Button } from "@/components/ui/button";

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-destructive/20 bg-status-failed-bg rounded-card min-h-[200px]">
      <div className="max-w-[420px] space-y-4">
        <div className="space-y-1.5">
          <h3 className="font-display font-semibold text-lg text-status-failed tracking-tight">
            Something went wrong
          </h3>
          <p className="text-sm text-status-failed font-sans leading-normal">
            {message || "Unable to fetch data. Please try again."}
          </p>
        </div>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="destructive"
            className="rounded-lg px-5 h-11 active:scale-95 text-[15px]"
          >
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
