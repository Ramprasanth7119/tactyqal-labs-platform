import Link from "next/link";
import { Container } from "@/components/site/container";

export default function PostNotFound() {
  return (
    <Container className="py-24 text-center">
      <h1 className="font-display text-4xl font-extrabold">That post does not exist</h1>
      <p className="mt-3 text-muted">It may have been unpublished, renamed or not yet scheduled to go live.</p>
      <Link href="/blog" className="mt-6 inline-block font-semibold text-accent-deep underline">
        Back to the blog
      </Link>
    </Container>
  );
}
