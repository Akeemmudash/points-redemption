import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 space-y-6">
        <div className="w-full max-w-[240px] space-y-3">
          <Skeleton className="h-8 w-2/3 mx-auto rounded-lg" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-5/6 mx-auto rounded-md" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
