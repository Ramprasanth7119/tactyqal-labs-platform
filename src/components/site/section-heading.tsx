import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  children,
  id,
  align = "left",
  tone = "light",
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  id?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  as?: "h1" | "h2";
}) {
  const center = align === "center";
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <p
          className={`mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] ${
            tone === "dark" ? "text-accent" : "text-accent-deep"
          }`}
        >
          <span aria-hidden className="h-0.5 w-6 bg-current" />
          {eyebrow}
        </p>
      )}
      <Tag id={id} className="font-display text-[clamp(1.9rem,4.6vw,3.1rem)] font-extrabold">
        {title}
      </Tag>
      {children && (
        <p className={`mt-4 text-lg ${tone === "dark" ? "text-cream/80" : "text-muted"}`}>
          {children}
        </p>
      )}
    </div>
  );
}
