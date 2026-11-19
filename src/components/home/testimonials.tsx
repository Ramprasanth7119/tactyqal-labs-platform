import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { testimonials } from "@/content/site";

const avatarTones = ["bg-sun", "bg-sage", "bg-rose", "bg-sky", "bg-accent-soft", "bg-sand"];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
}

export function Testimonials() {
  return (
    <section aria-labelledby="voices-title" className="py-20 sm:py-28">
      <Container>
        <SectionHeading id="voices-title" eyebrow="In their words" title="What our students say" />
        <ul className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3 [&>li]:mb-6 [&>li]:break-inside-avoid">
          {testimonials.map((t, i) => (
            <li key={t.name}>
              <figure className="rounded-3xl border-2 border-ink bg-paper p-6 shadow-card">
                <blockquote className="font-display text-xl font-bold leading-snug">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`grid h-11 w-11 place-items-center rounded-full border-2 border-ink font-display font-extrabold ${
                      avatarTones[i % avatarTones.length]
                    }`}
                  >
                    {initials(t.name)}
                  </span>
                  <span className="font-semibold">{t.name}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
