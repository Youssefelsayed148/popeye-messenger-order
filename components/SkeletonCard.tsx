export function SkeletonCard() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-paper"
      aria-hidden
    >
      <div className="aspect-square w-full animate-pulse rounded-t-xl bg-ink/5" />
      <div className="mt-2 flex items-start justify-between gap-2 px-3 pb-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-ink/5" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-ink/5" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
