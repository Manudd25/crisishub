export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

export function FeedSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading incidents">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="panel p-3 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}
