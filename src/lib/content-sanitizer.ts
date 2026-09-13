import "server-only";
import sanitizeHtml from "sanitize-html";

const allowedTags = ["p", "br", "strong", "b", "em", "i", "u", "s", "blockquote", "ul", "ol", "li", "h1", "h2", "h3", "h4", "a", "img"];

export function sanitizeCmsHtml(value: string) {
  return sanitizeHtml(value, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    enforceHtmlBoundary: true,
  });
}
