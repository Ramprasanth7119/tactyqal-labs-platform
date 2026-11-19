import { Clock, Mail, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/site/container";
import { Button } from "@/components/site/button";
import { contact } from "@/content/site";

export function FinalCta() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="bg-accent py-20 text-ink sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2
            id="contact-title"
            className="font-display text-[clamp(2.2rem,5.4vw,4rem)] font-extrabold"
          >
            Ready to start your teen&apos;s success story?
          </h2>
          <p className="mt-5 max-w-lg text-lg">
            Book a free consultation. We will talk through your teen&apos;s interests, answer your
            questions and tell you honestly if the program fits.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href={contact.whatsappHref} variant="dark" size="lg">
              <MessageCircle size={18} aria-hidden /> Chat on WhatsApp
            </Button>
            <Button href={contact.mailtoHref} variant="secondary" size="lg">
              <Mail size={18} aria-hidden /> Book by email
            </Button>
          </div>
        </div>
        <ul className="space-y-4 rounded-[2rem] border-2 border-ink bg-cream p-7 shadow-[var(--shadow-pop)]">
          <li>
            <a href={contact.mailtoHref} className="flex items-center gap-3 font-semibold hover:underline">
              <Mail size={20} aria-hidden /> {contact.email}
            </a>
          </li>
          <li>
            <a href={contact.phoneHref} className="flex items-center gap-3 font-semibold hover:underline">
              <Phone size={20} aria-hidden /> {contact.phoneDisplay}
            </a>
          </li>
          <li className="flex items-center gap-3">
            <Clock size={20} aria-hidden /> {contact.hours}
          </li>
          <li className="border-t border-line pt-4 text-muted">{contact.response}.</li>
        </ul>
      </Container>
    </section>
  );
}
