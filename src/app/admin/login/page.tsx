"use client";

import { useState, type FormEvent } from "react";
import { api, ApiError } from "../_components/api";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/auth/login", { method: "POST", body: { password } });
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/admin") ? next : "/admin";
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border-2 border-ink bg-paper p-7 shadow-[6px_6px_0_0_var(--color-ink)]">
        <h1 className="font-display text-2xl font-extrabold">Blog admin</h1>
        <p className="mt-1 text-sm text-muted">Sign in to manage posts, drafts and revisions.</p>
        <label htmlFor="pw" className="mt-6 block text-sm font-semibold">
          Password
        </label>
        <input
          id="pw"
          type="password"
          autoFocus
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border-2 border-ink bg-cream px-3 py-2.5"
        />
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-rose px-3 py-2 text-sm font-semibold text-accent-deep">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-full border-2 border-ink bg-accent px-5 py-3 font-bold shadow-[3px_3px_0_0_var(--color-ink)] disabled:opacity-60"
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
        {process.env.NODE_ENV !== "production" && (
          <p className="mt-4 text-xs text-muted">Dev default password: admin123 (unless ADMIN_PASSWORD is set).</p>
        )}
      </form>
    </main>
  );
}
