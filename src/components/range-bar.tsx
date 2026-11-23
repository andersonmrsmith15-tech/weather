/** Harorat oralig'i chizig'i: [min..max] umumiy shkala bo'yicha, o'rtacha qiymat belgisi bilan. */
export function RangeBar({
  min, max, mean, scaleMin, scaleMax,
}: {
  min: number | null; max: number | null; mean?: number | null; scaleMin: number; scaleMax: number;
}) {
  if (min == null || max == null) return <div className="h-2" />;
  const span = Math.max(1, scaleMax - scaleMin);
  const left = ((min - scaleMin) / span) * 100;
  const width = Math.max(2, ((max - min) / span) * 100);
  const m = mean != null ? ((mean - scaleMin) / span) * 100 : null;
  return (
    <div className="relative h-2 w-full min-w-24 rounded-full bg-surface-2" aria-hidden>
      <div
        className="absolute inset-y-0 rounded-full"
        style={{ left: `${left}%`, width: `${width}%`, background: "linear-gradient(90deg, var(--s-min), var(--s-max))" }}
      />
      {m != null && (
        <div className="absolute -top-0.5 h-3 w-1 -translate-x-1/2 rounded-full bg-ink ring-2 ring-surface" style={{ left: `${m}%` }} />
      )}
    </div>
  );
}
