import Link from "next/link";
import { CTA_HREF, nav } from "@/content/site";
import { Button } from "./button";
import { Container } from "./container";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream">
      <Container className="flex h-[4.25rem] items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-full px-4 py-2 text-[0.95rem] font-medium text-ink-2 transition-colors hover:bg-sand"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <Button href={CTA_HREF}>Book free consultation</Button>
          </div>
          <MobileNav items={nav} ctaHref={CTA_HREF} />
        </div>
      </Container>
    </header>
  );
}
