import { listPosts } from "@/lib/blog/posts";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cdata = (s: string) => `<![CDATA[${s.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;

export async function GET() {
  const { items } = await listPosts({ limit: 30, include: "content", sort: "-publishedAt" });
  const site = env.siteUrl;
  const last = items[0]?.publishedAt ?? new Date().toISOString();

  const entries = items
    .map((p) => {
      const url = `${site}/blog/${p.slug}`;
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.publishedAt ?? p.createdAt).toUTCString()}</pubDate>
      ${p.author ? `<dc:creator>${esc(p.author.name)}</dc:creator>` : ""}
      ${p.category ? `<category>${esc(p.category.name)}</category>` : ""}
      ${p.tags.map((t) => `<category>${esc(t.name)}</category>`).join("")}
      <description>${esc(p.excerpt)}</description>
      <content:encoded>${cdata(p.contentHtml ?? "")}</content:encoded>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Tactyqal Labs Blog</title>
    <link>${site}/blog</link>
    <atom:link href="${site}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>Startup ideas, founder playbooks and practical guides for young entrepreneurs.</description>
    <language>en</language>
    <lastBuildDate>${new Date(last).toUTCString()}</lastBuildDate>
${entries}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
