import { SITE_URL, contact, faqs } from "@/content/site";

export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${SITE_URL}/#org`,
        name: "Tactyqal Labs",
        url: SITE_URL,
        description:
          "1:1 mentoring that takes teens from idea to a launched full-stack app in 8 weeks, with no coding needed.",
        email: contact.email,
        telephone: "+919804772106",
        areaServed: "Worldwide",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: contact.email,
          telephone: "+919804772106",
          availableLanguage: "English",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      // Static, server-built content; "<" is escaped to keep the tag safe.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
