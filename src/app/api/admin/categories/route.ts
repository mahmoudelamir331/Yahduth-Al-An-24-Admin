import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentAccess, hasPermission } from "@/lib/authorization";
import { createClient } from "@/lib/supabase-server";

function canManageCategories(access: Awaited<ReturnType<typeof getCurrentAccess>>) {
  return Boolean(access.user && hasPermission(access, "content"));
}

async function requireCategoryAccess() {
  const access = await getCurrentAccess();
  if (!access.user) return { response: NextResponse.json({ error: "غير مصرح" }, { status: 401 }) } as const;
  if (!canManageCategories(access)) {
    return { response: NextResponse.json({ error: "ليس لديك صلاحية إدارة التصنيفات" }, { status: 403 }) } as const;
  }
  return { access } as const;
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

  const supabase = await createClient();
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

  const supabase = await createClient();
  const result = await supabase
    .from("categories")
    .insert({ name, slug, is_active: body?.is_active !== false })
    .select("id,name,slug,is_active")
    .single();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  return NextResponse.json({ category: result.data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCategoryAccess();
  if ("response" in auth) return auth.response;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = body?.id;
  const isActive = body?.is_active;
  if ((typeof id !== "number" && typeof id !== "string") || typeof isActive !== "boolean") {
    return NextResponse.json({ error: "معرف التصنيف وحالته مطلوبان" }, { status: 400 });
  }

  const supabase = await createClient();
  const result = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", id)
    .select("id,name,slug,is_active")
    .maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  if (!result.data) return NextResponse.json({ error: "التصنيف غير موجود" }, { status: 404 });
  return NextResponse.json({ category: result.data });
}

export const dynamic = "force-dynamic";
