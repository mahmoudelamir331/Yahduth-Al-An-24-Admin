import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { requireApiSuperAdmin } from "@/lib/authorization";
import { apiSchemas, validateJson } from "@/lib/api-validation";
import { writeAuditLog } from "@/lib/audit-log";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServiceClient } from "@/lib/supabase-server";

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
  | { response?: never; supabase: ReturnType<typeof createServiceClient>; user: User };

async function requireSuperAdmin(): Promise<TeamAccess> {
  const permission = await requireApiSuperAdmin();
  if ("response" in permission) return { response: NextResponse.json(await permission.response.json(), { status: permission.response.status }) };
  return { supabase: createServiceClient(), user: permission.access.user! };
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

  const parsed = await validateJson(request, apiSchemas.teamCreate);
  if ("response" in parsed) return parsed.response;
  const body = parsed.data;
  const email = body.email.toLowerCase();
  const name = body.name;
  const role = getEditableRole(body.role) ?? "editor";

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "إعدادات إنشاء الحسابات غير مكتملة" }, { status: 500 });
  }
  const created = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: name },
    redirectTo: new URL("/reset-password", request.url).toString(),
  });
  if (created.error) return NextResponse.json({ error: created.error.message }, { status: 500 });

  const newId = created.data.user?.id;
  if (!newId) return NextResponse.json({ error: "تعذر إنشاء الحساب" }, { status: 500 });

  const permissions = sanitizePermissions(body.permissions);
  const [permissionsResult, profileResult] = await Promise.all([
    admin.from("user_permissions").upsert({ user_id: newId, role, permissions }),
    admin.from("profiles").upsert({ user_id: newId, full_name: name }),
  ]);
  if (permissionsResult.error || profileResult.error) {
    await admin.auth.admin.deleteUser(newId);
    return NextResponse.json({ error: permissionsResult.error?.message ?? profileResult.error?.message ?? "تعذر تجهيز حساب الموظف" }, { status: 500 });
  }

  await writeAuditLog({ actorId: access.user.id, action: "team.invite", request, targetType: "user", targetId: newId, metadata: { role } });
  return NextResponse.json({ ok: true, message: `تم إنشاء حساب ${name} بنجاح` });
}

export async function PATCH(request: NextRequest) {
  const access = await requireSuperAdmin();
  if ("response" in access) return access.response;

  const parsed = await validateJson(request, apiSchemas.teamUpdate);
  if ("response" in parsed) return parsed.response;
  const body = parsed.data;
  const userId = getUserId(body.userId);
  const role = getEditableRole(body.role);
  if (userId === access.user.id) return NextResponse.json({ error: "لا يمكن تعديل صلاحيات حسابك من هذه الشاشة" }, { status: 400 });

  const target = await access.supabase.from("user_permissions").select("role").eq("user_id", userId).maybeSingle();
  if (target.error) return NextResponse.json({ error: target.error.message }, { status: 500 });
  if (!target.data) return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });
  if ((target.data as { role?: string }).role === "super_admin") {
    return NextResponse.json({ error: "لا يمكن تعديل صلاحيات المدير العام" }, { status: 403 });
  }

  const update = await access.supabase.from("user_permissions").update({ role, permissions: sanitizePermissions(body.permissions), updated_at: new Date().toISOString() }).eq("user_id", userId);
  if (update.error) return NextResponse.json({ error: update.error.message }, { status: 500 });
  await writeAuditLog({ actorId: access.user.id, action: "team.permissions.update", request, targetType: "user", targetId: userId, metadata: { role } });
  return NextResponse.json({ ok: true, message: "تم تحديث الصلاحيات بنجاح" });
}

export async function DELETE(request: NextRequest) {
  const access = await requireSuperAdmin();
  if ("response" in access) return access.response;

  const parsed = await validateJson(request, apiSchemas.teamDelete);
  if ("response" in parsed) return parsed.response;
  const userId = getUserId(parsed.data.userId);
  if (userId === access.user.id) return NextResponse.json({ error: "لا يمكن إزالة حسابك" }, { status: 400 });

  const target = await access.supabase.from("user_permissions").select("role").eq("user_id", userId).maybeSingle();
  if (target.error) return NextResponse.json({ error: target.error.message }, { status: 500 });
  if (!target.data) return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });
  if ((target.data as { role?: string }).role === "super_admin") {
    return NextResponse.json({ error: "لا يمكن إزالة المدير العام" }, { status: 403 });
  }

  const deleted = await access.supabase.from("user_permissions").delete().eq("user_id", userId);
  if (deleted.error) return NextResponse.json({ error: deleted.error.message }, { status: 500 });
  await writeAuditLog({ actorId: access.user.id, action: "team.remove", request, targetType: "user", targetId: userId });
  return NextResponse.json({ ok: true, message: "تمت إزالة الموظف من الفريق" });
}

export const dynamic = "force-dynamic";
