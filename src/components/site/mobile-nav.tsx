"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "./button";

type Item = { label: string; href: string };

export function MobileNav({ items, ctaHref }: { items: readonly Item[]; ctaHref: string }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>("a[href], button") ?? []).filter(
        (n) => !n.hasAttribute("disabled"),
      );
    focusables()[0]?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      // Trap focus between the toggle button and the panel's controls.
      const list = [toggleRef.current, ...focusables()].filter(Boolean) as HTMLElement[];
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onMq);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open, close]);

  return (
    <div className="lg:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => (open ? close() : setOpen(true))}
        className="relative z-50 grid h-11 w-11 place-items-center rounded-full border-2 border-ink bg-paper"
      >
        {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
      </button>

      {open && (
        <div
          ref={panelRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-x-0 top-0 z-40 flex min-h-dvh flex-col bg-cream px-5 pb-8 pt-24"
        >
          <nav aria-label="Mobile">
            <ul className="divide-y divide-line border-y border-line">
              {items.map((it) => (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-4 font-display text-2xl font-bold"
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-8">
            <Button href={ctaHref} size="lg" className="w-full" onClick={() => setOpen(false)}>
              Book free consultation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
