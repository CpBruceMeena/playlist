import { Skeleton } from "../ui/Skeleton";

interface LoadingSkeletonProps {
  variant?: "cards" | "player" | "list";
  count?: number;
}

export function LoadingSkeleton({ variant = "cards", count = 6 }: LoadingSkeletonProps) {
  if (variant === "player") {
    return (
      <div className="space-y-4">
        <Skeleton variant="rectangular" height={400} />
        <div className="flex gap-2">
          <Skeleton variant="text" width={80} />
          <Skeleton variant="text" width={80} />
          <Skeleton variant="text" width={80} />
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton variant="rectangular" width={48} height={48} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </div>
            <Skeleton variant="text" width={40} />
          </div>
        ))}
      </div>
    );
  }

  // Cards variant (default)
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-neutral-800 p-4">
          <Skeleton variant="rectangular" height={140} />
          <div className="space-y-2">
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton variant="text" width={60} />
            <Skeleton variant="text" width={40} />
          </div>
        </div>
      ))}
    </div>
  );
}
