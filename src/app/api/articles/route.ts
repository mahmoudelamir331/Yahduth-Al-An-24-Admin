import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireApiActionPermission } from "@/lib/authorization";
import { createServiceClient } from "@/lib/supabase-server";

/**
 * تحويل النص العربي أو الإنجليزي إلى slug متوافق ونظيف
 */
function slugify(text: string): string {
  const arabicMap: Record<string, string> = {
    ا: "a", أ: "a", إ: "a", آ: "a", ب: "b", ت: "t", ث: "th", ج: "j",
    ح: "h", خ: "kh", د: "d", ذ: "th", ر: "r", ز: "z", س: "s", ش: "sh",
    ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q",
    ك: "k", ل: "l", م: "m", ن: "n", ه: "h", و: "w", ي: "y", ى: "a",
    ة: "a", ء: "", ئ: "y", ؤ: "w",
  };

  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/[\u0600-\u06FF]/g, (char) => arabicMap[char] ?? "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return normalized || `article-${Date.now()}`;
}

async function generateUniqueSlug(supabase: ReturnType<typeof createServiceClient>, title: string): Promise<string> {
  const baseSlug = slugify(title);
  const { data } = await supabase
    .from("articles")
    .select("slug")
    .like("slug", `${baseSlug}%`)
    .limit(100);

  const existing = new Set((data ?? []).map((r: { slug: string }) => r.slug));
  if (!existing.has(baseSlug)) return baseSlug;

  let counter = 2;
  while (existing.has(`${baseSlug}-${counter}`)) {
    counter++;
  }
  return `${baseSlug}-${counter}`;
}

export async function POST(request: NextRequest) {
  const permission = await requireApiActionPermission("article.create");
  if ("response" in permission) return permission.response;
  const { access } = permission;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "عنوان الخبر مطلوب" }, { status: 400 });
  }

  const dbClient = createServiceClient();
  const slug = await generateUniqueSlug(dbClient, title);
  if (!slug.trim()) return NextResponse.json({ error: "تعذر توليد معرف المقال" }, { status: 400 });

  const rawContent = body?.content;
  let contentArray: string[];
  if (Array.isArray(rawContent)) {
    contentArray = rawContent.map((item) => String(item ?? "").trim()).filter(Boolean);
  } else if (typeof rawContent === "string" && rawContent.trim()) {
    contentArray = [rawContent.trim()];
  } else {
    contentArray = [""];
  }

  const authorName =
    typeof access.user.user_metadata?.full_name === "string" && access.user.user_metadata.full_name.trim()
      ? access.user.user_metadata.full_name.trim()
      : access.user.email ?? "فريق التحرير";

  const payload = {
    title,
    slug,
    excerpt: typeof body?.excerpt === "string" ? body.excerpt.trim() : "",
    content: contentArray,
    cover_image_url: typeof body?.cover_image_url === "string" && body.cover_image_url ? body.cover_image_url : null,
    category_id: typeof body?.category_id === "string" && body.category_id ? body.category_id : null,
    status: typeof body?.status === "string" && ["draft", "published", "review"].includes(body.status) ? body.status : "draft",
    author_name: authorName,
    created_by: access.user.id,
    updated_by: access.user.id,
  };

  const { data, error } = await dbClient.from("articles").insert(payload).select().single();
  if (error) {
    return NextResponse.json({ error: "تعذر حفظ الخبر حاليًا" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, article: data }, { status: 201 });
}

export const dynamic = "force-dynamic";
