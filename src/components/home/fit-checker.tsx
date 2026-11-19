"use client";

import { useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/site/button";
import { CTA_HREF } from "@/content/site";

type Option = { label: string; value: string };
type Question = { id: string; q: string; options: Option[] };

const questions: Question[] = [
  {
    id: "idea",
    q: "Does your teen have an idea, or a problem they care about?",
    options: [
      { label: "Yes, a clear idea", value: "idea" },
      { label: "A few vague ones", value: "vague" },
      { label: "Not yet", value: "none" },
    ],
  },
  {
    id: "time",
    q: "Can they spend about 2-3 hours a week for 8 weeks?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "Maybe, it depends on exams", value: "maybe" },
      { label: "Not right now", value: "no" },
    ],
  },
  {
    id: "code",
    q: "How much coding do they know?",
    options: [
      { label: "None", value: "none" },
      { label: "A little", value: "some" },
      { label: "A lot", value: "lot" },
    ],
  },
];

function result(a: Record<string, string>) {
  if (a.time === "no") {
    return {
      title: "Probably not this month",
      text: "The program works best with steady weekly time. Talk to us anyway and we will tell you honestly when it could fit, for example after exams.",
    };
  }
  const notes: string[] = [];
  if (a.idea === "none") notes.push("No idea yet is fine. The first two weeks are about finding one.");
  if (a.idea === "vague") notes.push("Vague ideas are a good start. Weeks 1-2 turn them into one clear plan.");
  if (a.idea === "idea") notes.push("A clear idea gives you a head start on research.");
  if (a.code === "none") notes.push("No coding is expected. The app is built with no-code tools.");
  if (a.code === "lot") notes.push("Strong coding is a bonus, but the focus is on building something people want.");
  if (a.time === "maybe") notes.push("Bring up the schedule in the call so we can plan around it.");
  return {
    title: "Looks like a good fit",
    text: notes.join(" "),
  };
}

export function FitChecker() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const answered = Object.keys(answers).length;
  const r = result(answers);

  return (
    <section aria-labelledby="fit-title" className="border-t border-line bg-sand/60 py-20 sm:py-28">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading id="fit-title" eyebrow="Quick check" title="Is this right for my teen?">
          Three questions, ten seconds. Nothing is stored or sent. It is a rough guide, not a test.
        </SectionHeading>

        <div className="rounded-[2rem] border-2 border-ink bg-paper p-6 shadow-[var(--shadow-pop)] sm:p-8">
          {!done ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (answered === questions.length) setDone(true);
              }}
            >
              <div className="space-y-7">
                {questions.map((q, n) => (
                  <fieldset key={q.id}>
                    <legend className="font-display text-lg font-bold">
                      <span className="mr-2 text-accent-deep">{n + 1}.</span>
                      {q.q}
                    </legend>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {q.options.map((o) => {
                        const on = answers[q.id] === o.value;
                        return (
                          <label
                            key={o.value}
                            className={`cursor-pointer rounded-full border-2 border-ink px-4 py-2 text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 ${
                              on ? "bg-ink text-cream" : "bg-cream hover:bg-sand"
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              value={o.value}
                              checked={on}
                              onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.value }))}
                              className="sr-only"
                            />
                            {o.label}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
              <div className="mt-8">
                <Button type="submit" disabled={answered < questions.length}>
                  See my answer <ArrowRight size={16} aria-hidden />
                </Button>
              </div>
            </form>
          ) : (
            <div role="status" aria-live="polite">
              <p className="text-sm font-bold uppercase tracking-wide text-accent-deep">Our honest take</p>
              <h3 className="mt-2 font-display text-3xl font-extrabold">{r.title}</h3>
              <p className="mt-3 text-lg text-muted">{r.text}</p>
              <p className="mt-4">
                The best next step is a free consultation. You can ask anything and there is no
                obligation.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button href={CTA_HREF}>Book free consultation</Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setAnswers({});
                    setDone(false);
                  }}
                >
                  <RotateCcw size={15} aria-hidden /> Start over
                </Button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
