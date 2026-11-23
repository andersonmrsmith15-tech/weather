"use client";

import { EmptyState } from "@/components/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState title="Xatolik yuz berdi">
      <p>{error.message || "Ma'lumotlarni yuklab bo'lmadi."}</p>
      <button onClick={reset} className="mt-3 rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-surface-2">
        Qayta urinish
      </button>
    </EmptyState>
  );
}
