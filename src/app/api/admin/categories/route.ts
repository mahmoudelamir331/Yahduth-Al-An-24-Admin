import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-route";

const permission = ["categories.manage"];
const slugify = (value: string) => value.trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, { allowedPermissions: permission });
  if ("error" in auth) return auth.error;
  const { data, error } = await auth.admin.from("categories").select("id,name,slug,is_active,created_at").order("created_at", { ascending: true });
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, { allowedPermissions: permission });
  if ("error" in auth) return auth.error;
  const body = await request.json() as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug) : slugify(name);
  if (!name || !slug) return NextResponse.json({ message: "اسم القسم مطلوب." }, { status: 400 });
  const { data, error } = await auth.admin.from("categories").insert({ name, slug, is_active: body.isActive !== false }).select("id,name,slug,is_active,created_at").single();
  if (error) return NextResponse.json({ message: error.code === "23505" ? "اسم أو رابط القسم موجود بالفعل." : error.message }, { status: 400 });
  return NextResponse.json({ category: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, { allowedPermissions: permission });
  if ("error" in auth) return auth.error;
  const body = await request.json() as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  const updates: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (typeof body.slug === "string" && body.slug.trim()) updates.slug = slugify(body.slug);
  if (typeof body.isActive === "boolean") updates.is_active = body.isActive;
  if (!id || !Object.keys(updates).length) return NextResponse.json({ message: "بيانات القسم ناقصة." }, { status: 400 });
  const { data, error } = await auth.admin.from("categories").update(updates).eq("id", id).select("id,name,slug,is_active,created_at").single();
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ category: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request, { allowedPermissions: permission });
  if ("error" in auth) return auth.error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ message: "معرف القسم ناقص." }, { status: 400 });
  const { error } = await auth.admin.from("categories").delete().eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ message: "تم حذف القسم." });
}
