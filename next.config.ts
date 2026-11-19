import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Migrations are read from disk at runtime; ship them with every server function.
  outputFileTracingIncludes: { "/**": ["./drizzle/**/*"] },
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
