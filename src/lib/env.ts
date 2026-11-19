// Central environment access. Edge-safe (no node imports) so middleware can use it.
// In development/test, insecure defaults let the app run without a .env file (with a warning).
// In production there are NO defaults: missing secrets disable admin access instead.

const isProd = process.env.NODE_ENV === "production";

const DEV_DEFAULTS = {
  ADMIN_API_KEY: "dev-admin-key",
  ADMIN_PASSWORD: "admin123",
  SESSION_SECRET: "dev-insecure-session-secret-change-me-please-0123456789",
} as const;

type SecretName = keyof typeof DEV_DEFAULTS;

const warned = new Set<string>();

function secret(name: SecretName): string | undefined {
  const v = process.env[name];
  if (v && v.length > 0) return v;
  if (isProd) return undefined;
  if (process.env.NODE_ENV !== "test" && !warned.has(name)) {
    warned.add(name);
    console.warn(
      `[tactyqal] ${name} is not set - using an insecure development default. Copy .env.example to .env before deploying.`,
    );
  }
  return DEV_DEFAULTS[name];
}

export const env = {
  get databaseUrl() {
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
    // Vercel's filesystem is read-only except /tmp. Without a configured database, run an
    // ephemeral demo database there (re-seeded on each cold start; writes do not persist).
    return process.env.VERCEL ? "file:/tmp/blog.db" : "file:./data/blog.db";
  },
  get databaseAuthToken() {
    return process.env.DATABASE_AUTH_TOKEN || undefined;
  },
  get adminApiKey() {
    return secret("ADMIN_API_KEY");
  },
  get adminPassword() {
    return secret("ADMIN_PASSWORD");
  },
  get sessionSecret() {
    return secret("SESSION_SECRET");
  },
  get siteUrl() {
    return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  },
  /** True when running the throwaway /tmp database on Vercel (no DATABASE_URL set). */
  get isEphemeralDemoDb() {
    return !process.env.DATABASE_URL && !!process.env.VERCEL;
  },
  get isProd() {
    return isProd;
  },
};
