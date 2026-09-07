import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireApiActionPermission } from "@/lib/authorization";
import { createServiceClient } from "@/lib/supabase-server";

async function requireCategoryAccess() {
  const result = await requireApiActionPermission("categories.manage");
  if ("response" in result) return result;
  return result;
}

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeSlug(value: unknown, fallbackName: string) {
  const source = typeof value === "string" ? value.trim() : fallbackName;
  return source
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET() {
  const auth = await requireCategoryAccess();
  if ("response" in auth) return auth.response;

  const supabase = createServiceClient();
  const result = await supabase
    .from("categories")
    .select("id,name,slug,is_active")
    .order("name", { ascending: true });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ categories: result.data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireCategoryAccess();
  if ("response" in auth) return auth.response;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = normalizeName(body?.name);
  const slug = normalizeSlug(body?.slug, name);
  if (!name || !slug) return NextResponse.json({ error: "اسم التصنيف مطلوب" }, { status: 400 });

  const supabase = createServiceClient();
  const result = await supabase
    .from("categories")
    .insert({ name, slug, is_active: body?.is_active !== false })
    .select("id,name,slug,is_active")
    .single();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  revalidatePath("/");
  revalidatePath("/category/[slug]", "page");
  return NextResponse.json({ category: result.data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCategoryAccess();
  if ("response" in auth) return auth.response;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = body?.id;
  if (typeof id !== "number" && typeof id !== "string") {
    return NextResponse.json({ error: "معرف التصنيف مطلوب" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  const name = normalizeName(body?.name);
  if (name) patch.name = name;
  const slugInput = typeof body?.slug === "string" ? body.slug.trim() : "";
  const slug = slugInput ? normalizeSlug(slugInput, "") : "";
  if (slug) patch.slug = slug;
  else if (name) patch.slug = normalizeSlug(null, name);
  if (typeof body?.is_active === "boolean") patch.is_active = body.is_active;

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "لا توجد بيانات للتعديل" }, { status: 400 });

  const supabase = createServiceClient();
  const result = await supabase
    .from("categories")
    .update(patch)
    .eq("id", id)
    .select("id,name,slug,is_active")
    .maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  if (!result.data) return NextResponse.json({ error: "التصنيف غير موجود" }, { status: 404 });
  revalidatePath("/");
  revalidatePath("/category/[slug]", "page");
  return NextResponse.json({ category: result.data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCategoryAccess();
  if ("response" in auth) return auth.response;

  const body = (await request.json().catch(() => null)) as { id?: number | string } | null;
  const id = body?.id;
  if (typeof id !== "number" && typeof id !== "string") {
    return NextResponse.json({ error: "معرف التصنيف مطلوب" }, { status: 400 });
  }

  const supabase = createServiceClient();
  // افصل المقالات المرتبطة بالقسم قبل الحذف حتى لا يحدث تعارض في قيود المفاتيح الأجنبية
  await supabase.from("articles").update({ category_id: null }).eq("category_id", id);
  const result = await supabase.from("categories").delete().eq("id", id).select("id").maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  if (!result.data) return NextResponse.json({ error: "التصنيف غير موجود" }, { status: 404 });
  revalidatePath("/");
  revalidatePath("/category/[slug]", "page");
  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";