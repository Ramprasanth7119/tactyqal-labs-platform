import {
  BadgeCheck,
  Coins,
  GraduationCap,
  HeartHandshake,
  Layers,
  Lightbulb,
  Presentation,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { features } from "@/content/site";

const icons: Record<string, LucideIcon> = {
  users: Users,
  layers: Layers,
  cap: GraduationCap,
  coins: Coins,
  mic: Presentation,
  bulb: Lightbulb,
  check: BadgeCheck,
  heart: HeartHandshake,
};

export function Why() {
  return (
    <section aria-labelledby="why-title" className="border-y border-line bg-sand/60 py-20 sm:py-28">
      <Container>
        <SectionHeading id="why-title" eyebrow="Why parents choose us" title="Everything a first launch needs">
          One mentor, one app, one clear finish line.
        </SectionHeading>
        <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => {
            const Icon = icons[f.icon];
            return (
              <li key={f.title}>
                <Reveal delay={(i % 4) * 70}>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-ink bg-paper shadow-[3px_3px_0_0_var(--color-ink)]">
                    <Icon size={22} aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-extrabold">{f.title}</h3>
                  <p className="mt-2 text-muted">{f.text}</p>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
