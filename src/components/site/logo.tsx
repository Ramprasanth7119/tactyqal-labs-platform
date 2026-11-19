import Link from "next/link";

export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Tactyqal Labs home">
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-xl border-2 border-ink bg-accent font-display text-lg font-extrabold text-ink shadow-[2px_2px_0_0_var(--color-ink)]"
      >
        T
      </span>
      <span
        className={`whitespace-nowrap font-display text-xl font-extrabold tracking-tight ${
          tone === "dark" ? "text-cream" : "text-ink"
        }`}
      >
        Tactyqal <span className="font-semibold opacity-70">Labs</span>
      </span>
    </Link>
  );
}
