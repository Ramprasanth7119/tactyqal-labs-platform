import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { contact, nav } from "@/content/site";
import { Container } from "./container";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="on-dark bg-ink text-cream">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <Logo tone="dark" />
          <p className="mt-4 max-w-sm text-cream/75">
            1:1 mentoring that helps teens turn an idea into a launched app in 8 weeks.
          </p>
        </div>
        <nav aria-label="Footer">
          <h2 className="font-display text-base font-bold">Explore</h2>
          <ul className="mt-3 space-y-2">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-cream/80 underline-offset-4 hover:text-cream hover:underline">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="font-display text-base font-bold">Talk to us</h2>
          <ul className="mt-3 space-y-2.5 text-cream/80">
            <li>
              <a href={contact.mailtoHref} className="inline-flex items-center gap-2 hover:text-cream hover:underline">
                <Mail size={16} aria-hidden /> {contact.email}
              </a>
            </li>
            <li>
              <a href={contact.phoneHref} className="inline-flex items-center gap-2 hover:text-cream hover:underline">
                <Phone size={16} aria-hidden /> {contact.phoneDisplay}
              </a>
            </li>
            <li>
              <a
                href={contact.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-cream hover:underline"
              >
                <MessageCircle size={16} aria-hidden /> WhatsApp us
              </a>
            </li>
            <li className="text-sm text-cream/60">{contact.hours}</li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-cream/15">
        <Container className="py-5 text-sm text-cream/60">
          &copy; {new Date().getFullYear()} Tactyqal Labs. All rights reserved.
        </Container>
      </div>
    </footer>
  );
}
