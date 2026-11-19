"use client";

import { useRef, useState } from "react";
import { Check, Clock, UserRound } from "lucide-react";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/site/button";
import { CTA_HREF, journey, journeyFacts, quote } from "@/content/site";

export function Journey() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const step = journey[active];

  function onKey(e: React.KeyboardEvent, i: number) {
    let next = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % journey.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + journey.length) % journey.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = journey.length - 1;
    else return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <section id="program" aria-labelledby="program-title" className="on-dark bg-ink py-20 text-cream sm:py-28">
      <Container>
        <SectionHeading
          id="program-title"
          eyebrow="The program"
          tone="dark"
          title="From idea to full app in 8 weeks"
        >
          Four fortnights, one live app. Pick a stage to see what happens.
        </SectionHeading>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
          <div
            role="tablist"
            aria-label="8-week journey"
            aria-orientation="vertical"
            className="flex flex-col gap-3"
          >
            {journey.map((s, i) => {
              const on = i === active;
              return (
                <button
                  key={s.weeks}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  role="tab"
                  id={`step-tab-${i}`}
                  aria-selected={on}
                  aria-controls="step-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => onKey(e, i)}
                  className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors ${
                    on
                      ? "border-accent bg-accent text-ink"
                      : "border-cream/25 hover:border-cream/60"
                  }`}
                >
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 font-display text-lg font-extrabold ${
                      on ? "border-ink bg-ink text-accent" : "border-cream/40"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span>
                    <span className={`block text-sm font-semibold ${on ? "text-ink" : "text-accent"}`}>
                      {s.weeks}
                    </span>
                    <span className="block font-display text-lg font-bold leading-tight sm:text-xl">
                      {s.title}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            id="step-panel"
            role="tabpanel"
            aria-labelledby={`step-tab-${active}`}
            tabIndex={0}
            className="focus-visible:outline-ink! rounded-[1.75rem] bg-cream p-7 text-ink sm:p-9"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-deep">{step.weeks}</p>
            <h3 className="mt-2 font-display text-3xl font-extrabold">{step.title}</h3>
            <p className="mt-3 text-lg text-muted">{step.summary}</p>
            <h4 className="mt-6 text-sm font-bold uppercase tracking-wide">What your teen does</h4>
            <ul className="mt-3 space-y-2.5">
              {step.doing.map((d) => (
                <li key={d} className="flex gap-3">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink text-cream">
                    <Check size={12} aria-hidden />
                  </span>
                  {d}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-2xl bg-sun px-5 py-4 font-semibold">
              <span className="block text-xs font-bold uppercase tracking-wide">By the end</span>
              {step.outcome}
            </p>
          </div>
        </div>

        <ul className="mt-10 flex flex-wrap gap-3">
          {journeyFacts.map((f, i) => (
            <li
              key={f}
              className="inline-flex items-center gap-2 rounded-full border border-cream/30 px-4 py-2 text-sm"
            >
              {i === 2 ? <UserRound size={15} aria-hidden /> : <Clock size={15} aria-hidden />}
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-cream/20 pt-10 md:flex-row md:items-center">
          <figure className="max-w-xl">
            <blockquote className="font-display text-xl font-bold leading-snug sm:text-2xl">
              &ldquo;{quote.text}&rdquo;
            </blockquote>
            <figcaption className="mt-2 text-sm text-cream/70">{quote.by}</figcaption>
          </figure>
          <Button href={CTA_HREF} size="lg">
            Start your journey today
          </Button>
        </div>
      </Container>
    </section>
  );
}
