import { cacheHeaders, handle, json, readBody } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guard";
import { createCategory, listCategories } from "@/lib/blog/taxonomy";
import { createTermSchema } from "@/lib/blog/validation";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const items = await listCategories();
  return json(items, { meta: { total: items.length }, headers: await cacheHeaders(req) });
});

export const POST = handle(async (req) => {
  await requireAdmin(req);
  const input = await readBody(req, createTermSchema);
  return json(await createCategory(input), { status: 201 });
});
