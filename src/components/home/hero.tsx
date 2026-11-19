import { ArrowRight, Check, Rocket, Sprout, Star } from "lucide-react";
import { Button } from "@/components/site/button";
import { Container } from "@/components/site/container";
import { CTA_HREF, heroBadges, heroPoints } from "@/content/site";

function HeroArt() {
  const steps = ["Idea", "Design", "Build", "Launch"];
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden>
      {/* main card: the 8-week arc */}
      <div className="relative rounded-[2rem] border-2 border-ink bg-paper p-6 shadow-[var(--shadow-pop)] sm:p-7">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold tracking-wide text-cream">
            YOUR TEEN&apos;S APP
          </span>
          <span className="text-xs font-semibold text-muted">8 weeks</span>
        </div>
        <p className="mt-5 font-display text-3xl font-extrabold leading-none sm:text-4xl">
          From &ldquo;what if&rdquo;
          <br />
          to <span className="marker">live</span>.
        </p>
        <ol className="mt-7 space-y-3">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink text-sm font-bold ${
                  i === 3 ? "bg-accent" : "bg-sand"
                }`}
              >
                {i === 3 ? <Rocket size={15} /> : <Check size={15} />}
              </span>
              <span className="h-3 flex-1 overflow-hidden rounded-full bg-sand">
                <span
                  className="block h-full origin-left rounded-full bg-ink"
                  style={{ width: `${(i + 1) * 25}%` }}
                />
              </span>
              <span className="w-14 text-right text-sm font-semibold">{s}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* floating proof chips, all drawn from real success stories */}
      <div
        className="bob absolute -right-2 -top-12 w-48 rotate-3 rounded-2xl border-2 border-ink bg-sun p-3.5 shadow-[3px_3px_0_0_var(--color-ink)] sm:-right-4"
        style={{ ["--r" as string]: "3deg" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide">One Last Chapter</p>
        <p className="font-display text-xl font-extrabold leading-tight">INR 100,000 / month</p>
        <p className="text-xs">started by a 13-year-old</p>
      </div>
      <div
        className="bob absolute -bottom-12 -left-2 flex w-52 -rotate-2 items-center gap-3 rounded-2xl border-2 border-ink bg-sage p-3.5 shadow-[3px_3px_0_0_var(--color-ink)] sm:-left-6"
        style={{ ["--r" as string]: "-2deg", animationDelay: "-3s" }}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-paper">
          <Sprout size={20} />
        </span>
        <div>
          <p className="text-sm font-bold leading-tight">KrishiDrishti</p>
          <p className="text-xs leading-tight">AI soil analysis for farmers</p>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="dots relative overflow-hidden">
      <Container className="grid items-center gap-14 pb-20 pt-12 sm:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:pb-28 lg:pt-20">
        <div>
          <p className="rise inline-flex items-center gap-2 rounded-full border-2 border-ink bg-paper px-4 py-1.5 text-sm font-semibold">
            <Star size={14} className="fill-accent text-ink" aria-hidden />
            100+ students mentored
          </p>
          <h1
            id="hero-title"
            className="rise mt-6 font-display text-[clamp(2.3rem,5.4vw,4rem)] font-extrabold"
            style={{ animationDelay: "80ms" }}
          >
            Empower your kid to build the next app that impacts millions, in{" "}
            <span className="marker">8 weeks</span>
          </h1>
          <p
            className="rise mt-6 max-w-xl text-lg text-muted sm:text-xl"
            style={{ animationDelay: "160ms" }}
          >
            Personal 1:1 mentoring takes your teen from a rough idea to a launched full-stack app.
            No coding needed.
          </p>
          <div
            className="rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ animationDelay: "240ms" }}
          >
            <Button href={CTA_HREF} size="lg">
              Book free consultation <ArrowRight size={18} aria-hidden className="transition-transform group-hover:translate-x-1" />
            </Button>
            <Button href="/#stories" variant="secondary" size="lg">
              See student apps
            </Button>
          </div>
          <ul
            className="rise mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[0.95rem] font-medium text-ink-2"
            style={{ animationDelay: "320ms" }}
          >
            {heroPoints.map((p) => (
              <li key={p} className="inline-flex items-center gap-1.5">
                <Check size={16} className="text-sage-deep" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
          <dl
            className="rise mt-10 grid max-w-xl grid-cols-3 gap-3 border-t-2 border-ink pt-6"
            style={{ animationDelay: "400ms" }}
          >
            {heroBadges.map((b) => (
              <div key={b.label}>
                <dt className="sr-only">{b.label}</dt>
                <dd>
                  <span className="block font-display text-3xl font-extrabold sm:text-4xl">{b.value}</span>
                  <span className="text-sm text-muted">{b.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <HeroArt />
      </Container>
    </section>
  );
}
