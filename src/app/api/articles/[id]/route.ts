import { NextResponse } from "next/server";
import { getCurrentAccess, hasActionPermission } from "@/lib/authorization";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getCurrentAccess();
  if (!access.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!hasActionPermission(access, "article.view")) return NextResponse.json({ error: "ليس لديك صلاحية مشاهدة الخبر" }, { status: 403 });
  const { id } = await params;
  const articleId = id?.trim();
  if (!articleId || articleId === "undefined" || articleId === "null") return NextResponse.json({ error: "معرف الخبر غير صحيح" }, { status: 400 });
  const result = await createServiceClient().from("articles").select("*").eq("id", articleId).maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "الخبر غير موجود" }, { status: 404 });
  return NextResponse.json({ article: result.data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getCurrentAccess();
  if (!access.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!hasActionPermission(access, "article.delete")) return NextResponse.json({ error: "ليس لديك صلاحية الحذف" }, { status: 403 });

  const { id } = await params;
  const articleId = id?.trim();
  if (!articleId || articleId === "undefined" || articleId === "null") return NextResponse.json({ error: "معرف الخبر غير صحيح" }, { status: 400 });

  const result = await createServiceClient().from("articles").delete().eq("id", articleId).select("id").maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "الخبر غير موجود" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getCurrentAccess();
  if (!access.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!hasActionPermission(access, "article.edit")) return NextResponse.json({ error: "ليس لديك صلاحية تعديل الخبر" }, { status: 403 });

  const { id } = await params;
  const articleId = id?.trim();
  if (!articleId || articleId === "undefined" || articleId === "null") return NextResponse.json({ error: "معرف الخبر غير صحيح" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "بيانات التعديل غير صحيحة" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  for (const key of ["title", "excerpt", "author_name", "cover_image_url"]) {
    if (typeof body[key] === "string") patch[key] = body[key].trim();
  }
  if (Array.isArray(body.content)) patch.content = body.content.map(String).filter(Boolean);
  if (typeof body.published_at === "string" && body.published_at) {
    const publishedAt = new Date(body.published_at);
    if (!Number.isNaN(publishedAt.getTime())) patch.published_at = publishedAt.toISOString();
  }
  const status = body?.status;
  if (typeof status === "string" && ["draft", "published", "review"].includes(status)) {
    patch.status = status;
    if (status === "published" && !patch.published_at) patch.published_at = new Date().toISOString();
    if (status === "draft") patch.published_at = null;
  }
  const categoryId = body?.category_id;
  if (typeof categoryId === "string" && categoryId) patch.category_id = categoryId;
  patch.updated_by = access.user.id;
  patch.updated_at = new Date().toISOString();

  const result = await createServiceClient().from("articles").update(patch).eq("id", articleId).select("id,title,status,published_at,category_id").maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "الخبر غير موجود" }, { status: 404 });
  return NextResponse.json({ ok: true, article: result.data });
}