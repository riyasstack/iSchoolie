export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="surface-card space-y-3 p-5" aria-busy="true" aria-live="polite">
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className={index % 2 === 0 ? 'h-3 w-full' : 'h-3 w-4/5'} />
      ))}
    </div>
  );
}
