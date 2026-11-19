import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { SITE_URL } from "@/content/site";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--nf-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Inter({
  variable: "--nf-body",
  subsets: ["latin"],
  display: "swap",
});

const description =
  "1:1 mentoring that takes your teen from idea to a launched full-stack app in 8 weeks, with no coding needed. Real apps, real revenue, stronger university applications.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Tactyqal Labs | Your teen builds a real app in 8 weeks",
    template: "%s | Tactyqal Labs",
  },
  description,
  applicationName: "Tactyqal Labs",
  openGraph: {
    type: "website",
    siteName: "Tactyqal Labs",
    title: "Tactyqal Labs | Your teen builds a real app in 8 weeks",
    description,
    url: "/",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tactyqal Labs | Your teen builds a real app in 8 weeks",
    description,
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#faf5ec",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
