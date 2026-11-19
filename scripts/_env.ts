// Load .env (if present) for CLI scripts. Next.js does this itself for the app.
try {
  process.loadEnvFile?.(".env");
} catch {
  /* no .env file */
}
