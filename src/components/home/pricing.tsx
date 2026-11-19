import { Check, ShieldCheck } from "lucide-react";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/site/button";
import { CTA_HREF, pricing } from "@/content/site";

export function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="py-20 sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] [&>*]:min-w-0">
        <div>
          <SectionHeading id="pricing-title" eyebrow="Pricing" title="One program. One clear price.">
            Everything is included. If your teen does the work and you do not see results, you get
            your money back.
          </SectionHeading>
          <p className="mt-8 inline-flex items-start gap-3 rounded-2xl border-2 border-ink bg-sage p-4 font-semibold">
            <ShieldCheck className="mt-0.5 shrink-0" size={22} aria-hidden />
            {pricing.guarantee}
          </p>
        </div>

        <div className="relative rounded-[2rem] border-2 border-ink bg-paper p-7 shadow-[var(--shadow-pop)] sm:p-9">
          <span className="absolute -top-4 right-6 rotate-2 rounded-full border-2 border-ink bg-accent px-4 py-1 text-sm font-bold">
            {pricing.note}
          </span>
          <p className="font-display text-xl font-bold">8-week 1:1 mentoring program</p>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
            <span className="font-display text-5xl font-extrabold sm:text-6xl">{pricing.now}</span>
            <span className="text-xl text-muted line-through decoration-2">
              <span className="sr-only">Regular price </span>
              {pricing.was}
            </span>
          </p>
          <ul className="mt-6 space-y-3 border-t border-line pt-6">
            {pricing.included.map((i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink text-cream">
                  <Check size={12} aria-hidden />
                </span>
                {i}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm font-semibold text-accent-deep">{pricing.seats}</p>
          <Button href={CTA_HREF} size="lg" className="mt-5 w-full">
            Book free consultation
          </Button>
          <p className="mt-3 text-center text-sm text-muted">Talk to us first. The consultation is free.</p>
        </div>
      </Container>
    </section>
  );
}
