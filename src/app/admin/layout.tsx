import type { Metadata } from "next";
import "./admin-preview.css";

export const metadata: Metadata = {
  title: "Admin | Tactyqal Labs Blog",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-cream text-ink">{children}</div>;
}
