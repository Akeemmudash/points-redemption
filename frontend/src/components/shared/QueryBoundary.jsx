import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";

export function QueryBoundary({
  isLoading,
  isError,
  error,
  onRetry,
  loadingFallback,
  children
}) {
  if (isLoading) {
    return (
      loadingFallback || (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3 rounded-lg" />
          <Skeleton className="h-[200px] w-full rounded-card" />
        </div>
      )
    );
  }

  if (isError) {
    return <ErrorState message={error?.message} onRetry={onRetry} />;
  }

  return children;
}
