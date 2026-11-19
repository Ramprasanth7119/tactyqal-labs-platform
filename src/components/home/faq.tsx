import { Plus } from "lucide-react";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { faqs } from "@/content/site";

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t border-line bg-sand/60 py-20 sm:py-28">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading id="faq-title" eyebrow="FAQ" title="Questions parents ask">
          Not here? Message us and we will answer within 24 hours.
        </SectionHeading>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details
              key={f.q}
              name="faq"
              open={i === 0}
              className="group rounded-2xl border-2 border-ink bg-paper"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-5 font-display text-lg font-bold">
                {f.q}
                <Plus
                  aria-hidden
                  size={22}
                  className="faq-plus shrink-0 transition-transform duration-200"
                />
              </summary>
              <p className="px-5 pb-5 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
