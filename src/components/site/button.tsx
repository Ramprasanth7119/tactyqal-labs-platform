import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "dark" | "ghost";
type Size = "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full font-semibold leading-none whitespace-nowrap transition-[transform,box-shadow,background-color] duration-200 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-ink border-2 border-ink shadow-[3px_3px_0_0_var(--color-ink)] hover:shadow-[5px_5px_0_0_var(--color-ink)] hover:-translate-x-0.5 hover:-translate-y-0.5",
  secondary: "bg-paper text-ink border-2 border-ink hover:bg-sand",
  dark: "bg-ink text-cream border-2 border-ink hover:bg-ink-2",
  ghost: "text-ink hover:bg-sand",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-3 text-[0.95rem]",
  lg: "px-7 py-4 text-base",
};

type Props = {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: Props) {
  const { onClick } = rest;
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  if (href) {
    const external = /^(https?:|mailto:|tel:)/.test(href);
    if (external) {
      const web = href.startsWith("http");
      return (
        <a
          href={href}
          className={cls}
          onClick={onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined}
          {...(web ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href}
        className={cls}
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined}
      >
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
