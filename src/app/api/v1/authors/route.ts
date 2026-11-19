import { cacheHeaders, handle, json, readBody } from "@/lib/api/http";
import { isAdminRequest, requireAdmin } from "@/lib/auth/guard";
import { createAuthor, listAuthors } from "@/lib/blog/taxonomy";
import { createAuthorSchema } from "@/lib/blog/validation";

export const dynamic = "force-dynamic";

/** Emails are only visible to admins. */
function present<T extends { email: string | null }>(a: T, admin: boolean) {
  const { email, ...rest } = a;
  return admin ? { ...rest, email } : rest;
}

export const GET = handle(async (req) => {
  const admin = await isAdminRequest(req);
  const items = (await listAuthors()).map((a) => present(a, admin));
  return json(items, { meta: { total: items.length }, headers: await cacheHeaders(req) });
});

export const POST = handle(async (req) => {
  await requireAdmin(req);
  const input = await readBody(req, createAuthorSchema);
  return json(present(await createAuthor(input), true), { status: 201 });
});
