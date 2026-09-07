import { NextResponse } from "next/server";
import { getCurrentAccess, hasActionPermission } from "@/lib/authorization";
import { createServiceClient } from "@/lib/supabase-server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getCurrentAccess();
  if (!access.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!hasActionPermission(access, "article.delete")) return NextResponse.json({ error: "ليس لديك صلاحية الحذف" }, { status: 403 });

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return NextResponse.json({ error: "رقم الخبر غير صحيح" }, { status: 400 });

  const result = await createServiceClient().from("articles").delete().eq("id", numericId).select("id").maybeSingle();
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
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return NextResponse.json({ error: "رقم الخبر غير صحيح" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "بيانات التعديل غير صحيحة" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  const status = body?.status;
  if (typeof status === "string" && ["draft", "published", "review"].includes(status) && status !== "draft") {
    patch.status = status;
    patch.published_at = status === "published" ? new Date().toISOString() : null;
  }
  const categoryId = body?.category_id;
  if (typeof categoryId === "string" && categoryId) patch.category_id = categoryId;
  patch.updated_by = access.user.id;
  patch.updated_at = new Date().toISOString();

  const result = await createServiceClient().from("articles").update(patch).eq("id", numericId).select("id,title,status,published_at,category_id").maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "الخبر غير موجود" }, { status: 404 });
  return NextResponse.json({ ok: true, article: result.data });
}