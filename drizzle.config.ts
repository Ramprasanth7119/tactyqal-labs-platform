import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile?.(".env");
} catch {
  /* no .env file: fall back to defaults */
}

const url = process.env.DATABASE_URL ?? "file:./data/blog.db";
const isRemote = /^(libsql|https?|wss?):/.test(url);

export default defineConfig({
  dialect: isRemote ? "turso" : "sqlite",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: isRemote
    ? { url, authToken: process.env.DATABASE_AUTH_TOKEN ?? "" }
    : { url },
});
