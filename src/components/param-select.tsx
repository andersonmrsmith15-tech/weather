"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  /** Joriy URL parametrlari (tanlangan qiymatdan tashqari saqlanadi) */
  params: Record<string, string>;
  basePath?: string;
};

export function ParamSelect({ label, name, value, options, params, basePath = "/" }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">{label}</span>
      <select
        className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink disabled:opacity-60"
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value) next.set(name, e.target.value);
          else next.delete(name);
          const qs = next.toString();
          startTransition(() => router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false }));
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
