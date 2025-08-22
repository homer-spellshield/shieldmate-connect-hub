import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface EnhancedSkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function EnhancedSkeleton({ className, children, ...props }: EnhancedSkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gradient-to-r from-muted via-muted/80 to-muted", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface LoadingCardProps {
  className?: string;
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}>
      <div className="space-y-4">
        <div className="space-y-2">
          <EnhancedSkeleton className="h-6 w-3/4" />
          <EnhancedSkeleton className="h-4 w-1/2" />
        </div>
        <div className="space-y-2">
          <EnhancedSkeleton className="h-4 w-full" />
          <EnhancedSkeleton className="h-4 w-4/5" />
        </div>
        <div className="flex gap-2">
          <EnhancedSkeleton className="h-6 w-16" />
          <EnhancedSkeleton className="h-6 w-20" />
        </div>
        <EnhancedSkeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

interface LoadingGridProps {
  items?: number;
  className?: string;
}

export function LoadingGrid({ items = 6, className }: LoadingGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}

interface LoadingHeaderProps {
  className?: string;
}

export function LoadingHeader({ className }: LoadingHeaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <EnhancedSkeleton className="h-8 w-64" />
      <EnhancedSkeleton className="h-4 w-96" />
    </div>
  );
}