import type { MetadataRoute } from "next";
import { listLiveSlugs } from "@/lib/blog/posts";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = env.siteUrl;
  let posts: Awaited<ReturnType<typeof listLiveSlugs>> = [];
  try {
    posts = await listLiveSlugs();
  } catch (err) {
    console.error("[sitemap] could not load posts", err);
  }
  return [
    { url: site, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/blog`, lastModified: posts[0]?.updatedAt, changeFrequency: "daily", priority: 0.8 },
    ...posts.map((p) => ({
      url: `${site}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
