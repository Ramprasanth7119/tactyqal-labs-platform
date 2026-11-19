import { getLatestPosts, type PostSummary } from "@/lib/blog/public";
import { BlogTeaser } from "@/components/home/blog-teaser";
import { Faq } from "@/components/home/faq";
import { FinalCta } from "@/components/home/final-cta";
import { FitChecker } from "@/components/home/fit-checker";
import { Hero } from "@/components/home/hero";
import { Journey } from "@/components/home/journey";
import { JsonLd } from "@/components/home/json-ld";
import { Pricing } from "@/components/home/pricing";
import { Stories } from "@/components/home/stories";
import { Testimonials } from "@/components/home/testimonials";
import { Tools } from "@/components/home/tools";
import { Why } from "@/components/home/why";

export const revalidate = 300;

export default async function HomePage() {
  let posts: PostSummary[] = [];
  try {
    // Never let a slow or unavailable blog database hold up the homepage.
    posts = await Promise.race([
      getLatestPosts(3),
      new Promise<PostSummary[]>((resolve) => setTimeout(() => resolve([]), 4000)),
    ]);
  } catch {
    posts = [];
  }

  return (
    <>
      <JsonLd />
      <Hero />
      <Journey />
      <Stories />
      <Why />
      <Pricing />
      <FitChecker />
      <Testimonials />
      <Tools />
      <BlogTeaser posts={posts} />
      <Faq />
      <FinalCta />
    </>
  );
}
