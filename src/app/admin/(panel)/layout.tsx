import Link from "next/link";
import { LogoutButton } from "../_components/logout-button";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-5">
            <Link href="/admin" className="font-display text-lg font-extrabold">
              Tactyqal <span className="text-accent-deep">Blog CMS</span>
            </Link>
            <nav className="hidden gap-4 text-sm font-semibold text-muted sm:flex">
              <Link href="/admin" className="hover:text-ink">Posts</Link>
              <Link href="/admin/posts/new" className="hover:text-ink">New post</Link>
              <Link href="/blog" className="hover:text-ink" target="_blank">View blog</Link>
              <Link href="/api-docs" className="hover:text-ink" target="_blank">API docs</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/posts/new" className="rounded-lg border-2 border-ink bg-accent px-3.5 py-1.5 text-sm font-bold sm:hidden">
              + New
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </>
  );
}
