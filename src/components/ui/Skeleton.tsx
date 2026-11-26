/**
 * Lightweight shimmer skeletons (server-safe, CSS only) used while lazy chunks
 * and route segments load, so content never pops in from a blank or text placeholder.
 */
export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} style={style} />;
}

export function CardGridSkeleton({ count = 3, minHeight = 420 }: { count?: number; minHeight?: number }) {
  return (
    <div className="skeleton-grid" style={{ minHeight }} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <Skeleton className="skeleton-media" />
          <Skeleton className="skeleton-line" style={{ width: '70%' }} />
          <Skeleton className="skeleton-line" style={{ width: '45%' }} />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 4, minHeight = 200 }: { rows?: number; minHeight?: number }) {
  return (
    <div className="skeleton-list" style={{ minHeight }} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="skeleton-row" />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="page-skeleton" role="status" aria-label="Loading page">
      <Skeleton className="skeleton-line" style={{ width: 140, height: 12 }} />
      <Skeleton className="skeleton-title" style={{ width: 'min(820px, 90%)' }} />
      <Skeleton className="skeleton-title" style={{ width: 'min(560px, 70%)' }} />
      <Skeleton className="skeleton-line" style={{ width: 'min(480px, 80%)', marginTop: 28 }} />
      <Skeleton className="skeleton-line" style={{ width: 'min(400px, 65%)' }} />
      <CardGridSkeleton count={3} minHeight={360} />
    </div>
  );
}
