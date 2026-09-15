import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

const email = z.string().trim().email().max(254);
const text = (max: number) => z.string().trim().max(max);
// Database columns are nullable, so optional text fields must accept null as well as
// an absent key — otherwise a partially filled article is rejected on save.
const optionalText = (max: number) => z.union([text(max), z.null()]).optional();
const urlValue = z.union([z.string().trim().url().max(2_000), z.literal(""), z.null()]).optional();
const optionalDate = z.string().datetime({ offset: true }).nullable().optional();
const identifier = z.union([z.string().trim().min(1).max(200), z.number().int().nonnegative()]);
const permissions = z.record(z.string().max(64), z.boolean()).optional();

export const apiSchemas = {
  passwordRequest: z.object({ email }).strict(),
  passwordDecision: z.object({ id: z.string().uuid(), action: z.enum(["approve", "reject"]), reason: text(500).optional() }).strict(),
  teamCreate: z.object({ email, name: text(120).min(1), role: z.enum(["editor", "reviewer"]).optional(), permissions }).strict(),
  teamUpdate: z.object({ userId: z.string().uuid(), role: z.enum(["editor", "reviewer"]), permissions }).strict(),
  teamDelete: z.object({ userId: z.string().uuid() }).strict(),
  articleCreate: z.object({ title: text(300).min(1), excerpt: optionalText(1000), content: z.union([z.string().max(100_000), z.array(z.string().max(100_000)).max(100), z.null()]).optional(), cover_image_url: urlValue, category_id: z.string().max(200).nullable().optional(), status: z.enum(["draft", "published", "review"]).optional(), published_at: optionalDate, author_name: optionalText(160) }).strict(),
  articleUpdate: z.object({ title: text(300).optional(), excerpt: optionalText(1000), content: z.union([z.array(z.string().max(100_000)).max(100), z.null()]).optional(), cover_image_url: urlValue, category_id: z.string().max(200).nullable().optional(), status: z.enum(["draft", "published", "review"]).optional(), published_at: optionalDate, author_name: optionalText(160) }).strict(),
  categoryCreate: z.object({ name: text(120).min(1), slug: text(120).optional(), is_active: z.boolean().optional() }).strict(),
  categoryUpdate: z.object({ id: identifier, name: text(120).optional(), slug: text(120).optional(), is_active: z.boolean().optional() }).strict(),
  categoryDelete: z.object({ id: identifier }).strict(),
  adCreate: z.object({
    title: text(160).min(1),
    image_url: urlValue,
    target_url: urlValue,
    custom_code: text(100_000).nullable().optional(),
    placement: z.enum(["header", "sidebar", "in_article", "home_page"]),
    ad_type: z.enum(["image_link", "custom_code"]),
    status: z.boolean().optional().default(true),
    start_date: z.string().datetime().nullable().optional(),
    end_date: z.string().datetime().nullable().optional(),
  }).strict().superRefine((value, context) => {
    if (value.ad_type === "image_link" && !value.image_url) context.addIssue({ code: "custom", path: ["image_url"], message: "صورة الإعلان مطلوبة" });
    if (value.ad_type === "custom_code" && !value.custom_code?.trim()) context.addIssue({ code: "custom", path: ["custom_code"], message: "كود الإعلان مطلوب" });
    if (value.start_date && value.end_date && new Date(value.end_date) < new Date(value.start_date)) context.addIssue({ code: "custom", path: ["end_date"], message: "تاريخ النهاية يجب أن يكون بعد البداية" });
  }),
  adUpdate: z.object({
    id: z.string().uuid(),
    title: text(160).min(1).optional(),
    image_url: urlValue,
    target_url: urlValue,
    custom_code: text(100_000).nullable().optional(),
    placement: z.enum(["header", "sidebar", "in_article", "home_page"]).optional(),
    ad_type: z.enum(["image_link", "custom_code"]).optional(),
    status: z.boolean().optional(),
    start_date: z.string().datetime().nullable().optional(),
    end_date: z.string().datetime().nullable().optional(),
  }).strict(),
  adDelete: z.object({ id: z.string().uuid() }).strict(),
  adStatus: z.object({ id: z.string().uuid(), status: z.boolean() }).strict(),
  staticPage: z.object({ slug: z.enum(["about", "contact", "privacy", "terms"]), title: text(200).optional(), content: z.string().max(100_000).optional() }).strict(),
  staticPageCreate: z.object({ slug: text(80).min(1).regex(/^[a-z0-9-]+$/, "معرف الصفحة يجب أن يكون أحرف إنجليزية صغيرة وأرقام وشرطات فقط"), title: text(200).min(1), content: z.string().max(100_000).optional(), seo_title: text(200).nullable().optional(), seo_description: text(500).nullable().optional(), is_visible: z.boolean().optional().default(true) }).strict(),
  staticPageUpdate: z.object({ slug: text(80).min(1), title: text(200).optional(), content: z.string().max(100_000).optional(), seo_title: text(200).nullable().optional(), seo_description: text(500).nullable().optional(), is_visible: z.boolean().optional() }).strict(),
  staticPageDelete: z.object({ slug: text(80).min(1) }).strict(),
  settings: z.object({
    founder_name: text(160).nullable().optional(), founder_description: text(5_000).nullable().optional(), founder_image_url: urlValue, founder_contact_url: urlValue, contact_phone: text(50).nullable().optional(), contact_address: text(500).nullable().optional(), contact_whatsapp: text(100).nullable().optional(), social_facebook: urlValue, social_twitter: urlValue, social_youtube: urlValue, maintenance_enabled: z.boolean().optional(), maintenance_message: text(2_000).nullable().optional(), maintenance_ends_at: z.string().nullable().optional(), logo_url: urlValue, favicon_url: urlValue, live_streams: z.array(z.object({ id: text(100), youtubeId: text(200), title: text(300), channel: text(300), enabled: z.boolean().optional() }).strict()).max(20).optional(),
  }).strict(),
};

export async function validateJson<T extends z.ZodType>(request: Request, schema: T): Promise<{ data: z.infer<T> } | { response: NextResponse }> {
  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return { response: NextResponse.json({ error: "بيانات الطلب غير صالحة" }, { status: 400 }) };
  return { data: parsed.data };
}
