import Link from "next/link";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-surface ${className}`}>{children}</section>;
}

export function CardHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4 sm:px-5">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <Card className="px-4 py-3 sm:px-5">
      <div className="text-xs text-muted">{label}</div>
      <div className="tabular mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-0.5 truncate text-xs text-ink-2">{hint}</div>}
    </Card>
  );
}

export function Tabs({ items }: { items: { href: string; label: string; active: boolean }[] }) {
  return (
    <nav className="inline-flex rounded-lg border border-line bg-surface p-1" aria-label="Ko'rinish">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
            t.active ? "bg-ink text-bg font-medium" : "text-ink-2 hover:bg-surface-2"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export function Legend({ items }: { items: { label: string; color: string; kind?: "line" | "bar" }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={i.kind === "bar" ? "h-2.5 w-2.5 rounded-sm" : "h-0.5 w-4 rounded-full"}
            style={{ background: i.color }}
          />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-2 ${className}`} />;
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="mx-auto max-w-xl p-6 text-center">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-2 text-sm text-ink-2">{children}</div>
    </Card>
  );
}
