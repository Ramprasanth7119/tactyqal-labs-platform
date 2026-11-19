import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  ...sanitizeHtml.defaults.allowedTags,
  "img", "h1", "h2", "h3", "h4", "h5", "h6", "figure", "figcaption", "del", "ins", "sup", "sub", "mark", "details", "summary", "hr",
];

/** Markdown -> sanitized HTML. Raw HTML in the markdown (e.g. from WordPress) is kept but cleaned. */
export function renderMarkdown(markdown: string): string {
  const raw = marked.parse(markdown ?? "", { async: false, gfm: true }) as string;
  return sanitizeHtml(raw, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "title", "rel", "target"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      code: ["class"],
      th: ["align"],
      td: ["align"],
      "*": ["id"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https"] },
    transformTags: {
      a: (tagName, attribs) => {
        const external = /^https?:\/\//i.test(attribs.href ?? "");
        return {
          tagName,
          attribs: external ? { ...attribs, rel: "noopener noreferrer nofollow", target: "_blank" } : attribs,
        };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    },
  });
}

export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** ~220 words per minute, never below 1. */
export function readingMinutes(markdown: string): number {
  const text = stripMarkdown(markdown);
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.ceil(words / 220));
}

export function deriveExcerpt(markdown: string, max = 180): string {
  const text = stripMarkdown(markdown);
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "...";
}
