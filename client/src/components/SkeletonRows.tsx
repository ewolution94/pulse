/** The shape of the list while the first status is on its way. */
export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-2xl border border-line bg-ink/60 p-5">
          <div className="flex items-center justify-between">
            <div className="skeleton h-3.5 w-28 rounded-full" />
            <div className="skeleton h-3.5 w-20 rounded-full" />
          </div>
          <div className="skeleton mt-5 h-8 rounded-[3px]" />
        </div>
      ))}
    </div>
  );
}
