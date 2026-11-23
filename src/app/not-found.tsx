import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <EmptyState title="Sahifa topilmadi">
      <Link href="/" className="text-accent hover:underline">Bosh sahifaga qaytish</Link>
    </EmptyState>
  );
}
