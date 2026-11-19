import { handle, json, readBody } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guard";
import { readingMinutes, renderMarkdown } from "@/lib/blog/markdown";
import { previewSchema } from "@/lib/blog/validation";

export const dynamic = "force-dynamic";

/** Render markdown with the exact sanitizer used on save. Powers the admin live preview. */
export const POST = handle(async (req) => {
  await requireAdmin(req);
  const { markdown } = await readBody(req, previewSchema);
  return json({ html: renderMarkdown(markdown), readingMinutes: readingMinutes(markdown) });
});
