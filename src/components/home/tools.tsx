import { ArrowUpRight, Wrench } from "lucide-react";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/site/button";
import { TOOLS_URL, tools } from "@/content/site";

export function Tools() {
  return (
    <section id="tools" aria-labelledby="tools-title" className="border-t border-line bg-sand/60 py-20 sm:py-24">
      <Container>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading id="tools-title" eyebrow="Free tools" title="Try the thinking, free">
            Used by 1000+ entrepreneurs. Start with a tool and see how your teen thinks about ideas.
          </SectionHeading>
          <Button href={TOOLS_URL} variant="secondary" className="self-start md:self-auto">
            Access all tools free <ArrowUpRight size={16} aria-hidden />
          </Button>
        </div>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((t) => (
            <li
              key={t}
              className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-paper p-4 font-semibold"
            >
              <Wrench size={18} className="shrink-0 text-accent-deep" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
