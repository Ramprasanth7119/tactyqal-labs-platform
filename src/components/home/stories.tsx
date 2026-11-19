"use client";

import { useState } from "react";
import { BookOpen, Languages, Music, PawPrint, ShoppingBag, Sprout, type LucideIcon } from "lucide-react";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { stories, storyFilters, type Story } from "@/content/site";

const icons: Record<Story["icon"], LucideIcon> = {
  sprout: Sprout,
  bag: ShoppingBag,
  book: BookOpen,
  paw: PawPrint,
  music: Music,
  languages: Languages,
};

const tones: Record<Story["tone"], { bg: string; fg: string }> = {
  clay: { bg: "bg-accent-soft", fg: "text-accent-deep" },
  sage: { bg: "bg-sage", fg: "text-sage-deep" },
  sun: { bg: "bg-sun", fg: "text-ink" },
  sky: { bg: "bg-sky", fg: "text-ink" },
  rose: { bg: "bg-rose", fg: "text-accent-deep" },
  ink: { bg: "bg-ink", fg: "text-accent" },
};

export function Stories() {
  const [filter, setFilter] = useState<(typeof storyFilters)[number]>("All");
  const shown = stories.filter((s) => filter === "All" || s.categories.includes(filter));

  return (
    <section id="stories" aria-labelledby="stories-title" className="py-20 sm:py-28">
      <Container>
        <SectionHeading id="stories-title" eyebrow="Success stories" title="Real students. Real apps. Real results.">
          Apps built by teens in the program. Filter by the kind of idea.
        </SectionHeading>

        <div role="group" aria-label="Filter stories by category" className="mt-8 flex flex-wrap gap-2">
          {storyFilters.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-full border-2 border-ink px-4 py-2 text-sm font-semibold transition-colors ${
                filter === f ? "bg-ink text-cream" : "bg-paper hover:bg-sand"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          Showing {shown.length} of {stories.length} stories
        </p>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((s) => {
            const Icon = icons[s.icon];
            const t = tones[s.tone];
            return (
              <li
                key={s.name}
                className="flex flex-col overflow-hidden rounded-3xl border-2 border-ink bg-paper shadow-card transition-transform duration-200 hover:-translate-y-1"
              >
                <div className={`relative flex h-36 items-end justify-between p-5 ${t.bg} ${t.fg}`}>
                  <span
                    aria-hidden
                    className="absolute -right-6 -top-6 h-28 w-28 rounded-full border-2 border-current opacity-30"
                  />
                  <Icon size={44} strokeWidth={1.6} aria-hidden />
                  <ul className="flex flex-wrap justify-end gap-1.5">
                    {s.categories.map((c) => (
                      <li
                        key={c}
                        className="rounded-full border-2 border-ink bg-paper px-2.5 py-0.5 text-xs font-bold text-ink"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-xl font-extrabold">{s.name}</h3>
                  <p className="mt-2 text-muted">{s.blurb}</p>
                  {(s.tag || s.proof) && (
                    <p className="mt-auto pt-4 text-sm font-semibold">
                      {s.tag && <span className="block text-muted">{s.tag}</span>}
                      {s.proof && <span className="mt-1 inline-block rounded-md bg-sun px-2 py-0.5">{s.proof}</span>}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
