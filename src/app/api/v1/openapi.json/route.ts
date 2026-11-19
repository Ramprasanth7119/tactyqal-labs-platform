import { openApiSpec } from "@/lib/api/openapi";

export const dynamic = "force-static";

export function GET() {
  return Response.json(openApiSpec, { headers: { "Cache-Control": "public, max-age=300" } });
}
