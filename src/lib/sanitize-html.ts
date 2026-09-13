"use client";

import DOMPurify from "dompurify";

export function sanitizePreviewHtml(value: string) {
  return DOMPurify.sanitize(value, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "u", "s", "blockquote", "ul", "ol", "li", "a", "h2", "h3", "h4", "img", "figure", "figcaption"],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "title", "width", "height", "loading"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  });
}
