import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase-server";

const editableRoles = new Set(["editor", "reviewer"]);
const editablePermissionKeys = new Set([
  "article.create",
  "article.edit",
  "article.delete",
  "categories.manage",
  "live.start",
  "live.edit",
  "live.stop",
  "ads.create",
  "ads.edit",
  "ads.delete",
  "settings.manage",
  "team.add",
  "team.permissions",
]);

type TeamAccess =
  | { response: NextResponse; supabase?: never; user?: never }
  | { response?: never; supabase: Awaited<ReturnType<typeof createServerClient>>; user: User };

async function requireSuperAdmin(): Promise<TeamAccess> {
  const supabase = await createServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return { response: NextResponse.json({ error: "غير مصرح" }, { status: 401 }) };

  const result = await supabase.from("user_permissions").select("role").eq("user_id", user.id).maybeSingle();
  if ((result.data as { role?: string } | null)?.role !== "super_admin") {
    return { response: NextResponse.json({ error: "هذه العملية للمدير العام فقط" }, { status: 403 }) };
  }

  return { supabase, user };
}

function getBody(request: NextRequest) {
  return request.json().catch(() => null) as Promise<Record<string, unknown> | null>;
}

function sanitizePermissions(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const permissions: Record<string, boolean> = {};
  for (const [key, enabled] of Object.entries(value)) {
    if (editablePermissionKeys.has(key) && enabled === true) permissions[key] = true;
  }
  return permissions;
}

function getEditableRole(value: unknown) {
  return typeof value === "string" && editableRoles.has(value) ? value : null;
}

function getUserId(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function GET() {
  const access = await requireSuperAdmin();
  if ("response" in access) return access.response;

  const [membersResult, profilesResult] = await Promise.all([
    access.supabase.from("user_permissions").select("user_id,role,permissions").order("created_at"),
    access.supabase.from("profiles").select("user_id,full_name"),
  ]);
  if (membersResult.error) return NextResponse.json({ error: membersResult.error.message }, { status: 500 });
  if (profilesResult.error) return NextResponse.json({ error: profilesResult.error.message }, { status: 500 });

  const profiles = new Map(((profilesResult.data ?? []) as { user_id: string; full_name: string | null }[]).map((profile) => [profile.user_id, profile.full_name]));
  const members = ((membersResult.data ?? []) as { user_id: string; role: string; permissions: Record<string, boolean> }[]).map((member) => ({
    ...member,
    full_name: profiles.get(member.user_id) ?? null,
  }));
  return NextResponse.json({ members });
}

export async function POST(request: NextRequest) {
  const access = await requireSuperAdmin();
  if ("response" in access) return access.response;

  const body = await getBody(request);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const role = getEditableRole(body?.role) ?? "editor";
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "الاسم والبريد الإلكتروني الصحيح مطلوبان" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "إعدادات إنشاء الحسابات غير مكتملة" }, { status: 500 });
  }

  const admin = createAdminClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const tempPassword = `Yah${Math.random().toString(36).slice(2, 10)}!24`;
  const created = await admin.auth.admin.createUser({ email, password: tempPassword, email_confirm: true, user_metadata: { full_name: name } });
  if (created.error) return NextResponse.json({ error: created.error.message }, { status: 500 });

  const newId = created.data.user?.id;
  if (!newId) return NextResponse.json({ error: "تعذر إنشاء الحساب" }, { status: 500 });

  const permissions = sanitizePermissions(body?.permissions);
  const [permissionsResult, profileResult] = await Promise.all([
    admin.from("user_permissions").upsert({ user_id: newId, role, permissions }),
    admin.from("profiles").upsert({ user_id: newId, full_name: name }),
  ]);
  if (permissionsResult.error || profileResult.error) {
    await admin.auth.admin.deleteUser(newId);
    return NextResponse.json({ error: permissionsResult.error?.message ?? profileResult.error?.message ?? "تعذر تجهيز حساب الموظف" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: `تم إنشاء حساب ${name} — الباسورد المؤقت: ${tempPassword} (ابعتله للموظف وهو يقدر يقدم طلب تغييره)` });
}

export async function PATCH(request: NextRequest) {
  const access = await requireSuperAdmin();
  if ("response" in access) return access.response;

  const body = await getBody(request);
  const userId = getUserId(body?.userId);
  const role = getEditableRole(body?.role);
  if (!userId || !role) return NextResponse.json({ error: "بيانات التعديل غير صحيحة" }, { status: 400 });
  if (userId === access.user.id) return NextResponse.json({ error: "لا يمكن تعديل صلاحيات حسابك من هذه الشاشة" }, { status: 400 });

  const target = await access.supabase.from("user_permissions").select("role").eq("user_id", userId).maybeSingle();
  if (target.error) return NextResponse.json({ error: target.error.message }, { status: 500 });
  if (!target.data) return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });
  if ((target.data as { role?: string }).role === "super_admin") {
    return NextResponse.json({ error: "لا يمكن تعديل صلاحيات المدير العام" }, { status: 403 });
  }

  const update = await access.supabase.from("user_permissions").update({ role, permissions: sanitizePermissions(body?.permissions), updated_at: new Date().toISOString() }).eq("user_id", userId);
  if (update.error) return NextResponse.json({ error: update.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message: "تم تحديث الصلاحيات بنجاح" });
}

export async function DELETE(request: NextRequest) {
  const access = await requireSuperAdmin();
  if ("response" in access) return access.response;

  const body = await getBody(request);
  const userId = getUserId(body?.userId);
  if (!userId) return NextResponse.json({ error: "معرف الموظف مطلوب" }, { status: 400 });
  if (userId === access.user.id) return NextResponse.json({ error: "لا يمكن إزالة حسابك" }, { status: 400 });

  const target = await access.supabase.from("user_permissions").select("role").eq("user_id", userId).maybeSingle();
  if (target.error) return NextResponse.json({ error: target.error.message }, { status: 500 });
  if (!target.data) return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });
  if ((target.data as { role?: string }).role === "super_admin") {
    return NextResponse.json({ error: "لا يمكن إزالة المدير العام" }, { status: 403 });
  }

  const deleted = await access.supabase.from("user_permissions").delete().eq("user_id", userId);
  if (deleted.error) return NextResponse.json({ error: deleted.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message: "تمت إزالة الموظف من الفريق" });
}

export const dynamic = "force-dynamic";
