import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const roles = ["manager", "editor", "advertiser"];
const knownPermissionKeys = new Set([
  "news.view", "news.create", "news.edit.own", "news.edit.any", "news.publish", "news.review", "news.archive", "news.delete",
  "media.view", "media.upload", "media.delete", "media.watermark",
  "ads.view", "ads.create", "ads.toggle",
  "settings.edit", "settings.maintenance", "settings.social", "users.manage", "team.manage", "categories.manage", "stats.view",
]);
async function authorize(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) return { error: NextResponse.json({ message: "إعدادات الخادم ناقصة." }, { status: 500 }) };
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: NextResponse.json({ message: "انتهت جلسة تسجيل الدخول." }, { status: 401 }) };
  const authClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: authData } = await authClient.auth.getUser();
  if (!authData.user) return { error: NextResponse.json({ message: "انتهت جلسة تسجيل الدخول." }, { status: 401 }) };
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const [{ data: profile }, { data: permission }] = await Promise.all([
    admin.from("profiles").select("role,is_active").eq("id", authData.user.id).single(),
    admin.from("user_permissions").select("permission_key").eq("user_id", authData.user.id).eq("permission_key", "team.manage").maybeSingle(),
  ]);
  if (!profile?.is_active || (profile.role !== "super_admin" && !permission)) return { error: NextResponse.json({ message: "غير مسموح لك بإدارة الفريق." }, { status: 403 }) };
  return { admin, userId: authData.user.id };
}
function selectedPermissions(body: Record<string, unknown>) {
  return Array.from(new Set(Array.isArray(body.permissions) ? body.permissions.filter((item): item is string => typeof item === "string") : []));
}

function hasOnlyKnownPermissions(permissions: string[]) {
  return permissions.every((permission) => knownPermissionKeys.has(permission));
}

export async function GET(request: NextRequest) {
  const auth = await authorize(request);
  if ("error" in auth) return auth.error;
  const { data, error } = await auth.admin
    .from("profiles")
    .select("id,full_name,role,is_active,created_at,user_permissions(permission_key)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ staff: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await authorize(request); if ("error" in auth) return auth.error;
  const body = await request.json() as Record<string, unknown>;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "", email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "", password = typeof body.password === "string" ? body.password : "", role = typeof body.role === "string" ? body.role : "", permissions = selectedPermissions(body);
  if (!fullName || !email || password.length < 8 || !roles.includes(role)) return NextResponse.json({ message: "راجع بيانات الموظف وكلمة المرور." }, { status: 400 });
  if (!hasOnlyKnownPermissions(permissions)) return NextResponse.json({ message: "تم إرسال صلاحية غير صالحة." }, { status: 400 });
  const { data: created, error: createError } = await auth.admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (createError || !created.user) return NextResponse.json({ message: createError?.message ?? "تعذر إنشاء الحساب." }, { status: 400 });
  const { error: profileError } = await auth.admin.from("profiles").insert({ id: created.user.id, full_name: fullName, role, is_active: true });
  if (profileError) { await auth.admin.auth.admin.deleteUser(created.user.id); return NextResponse.json({ message: "تعذر حفظ ملف الموظف." }, { status: 500 }); }
  if (permissions.length) {
    const { error: permissionsError } = await auth.admin.from("user_permissions").insert(permissions.map((permission_key) => ({ user_id: created.user.id, permission_key })));
    if (permissionsError) {
      await auth.admin.auth.admin.deleteUser(created.user.id);
      await auth.admin.from("profiles").delete().eq("id", created.user.id);
      return NextResponse.json({ message: "تعذر حفظ صلاحيات الموظف: " + permissionsError.message }, { status: 500 });
    }
  }
  return NextResponse.json({ message: "تمت إضافة الموظف وتحديد صلاحياته." }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await authorize(request); if ("error" in auth) return auth.error;
  const body = await request.json() as Record<string, unknown>, targetId = typeof body.targetId === "string" ? body.targetId : "", action = typeof body.action === "string" ? body.action : "";
  if (!targetId || targetId === auth.userId) return NextResponse.json({ message: "لا يمكن تعديل حسابك من هنا." }, { status: 400 });
  if (action === "delete") { const { error } = await auth.admin.auth.admin.deleteUser(targetId); if (error) return NextResponse.json({ message: error.message }, { status: 400 }); return NextResponse.json({ message: "تم حذف الموظف." }); }
  if (action === "password") { const password = typeof body.password === "string" ? body.password : ""; if (password.length < 8) return NextResponse.json({ message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." }, { status: 400 }); const { error } = await auth.admin.auth.admin.updateUserById(targetId, { password }); if (error) return NextResponse.json({ message: error.message }, { status: 400 }); return NextResponse.json({ message: "تم تغيير كلمة المرور." }); }
  if (action === "status") { const { data: current } = await auth.admin.from("profiles").select("is_active").eq("id", targetId).single(); const { error } = await auth.admin.from("profiles").update({ is_active: !current?.is_active }).eq("id", targetId); if (error) return NextResponse.json({ message: error.message }, { status: 400 }); return NextResponse.json({ message: "تم تحديث حالة الحساب." }); }
  if (action === "update") { const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "", role = typeof body.role === "string" ? body.role : "", permissions = selectedPermissions(body); if (!fullName || !roles.includes(role)) return NextResponse.json({ message: "راجع اسم الموظف ودوره." }, { status: 400 }); const { data: available } = await auth.admin.from("permissions").select("key").in("key", permissions); if ((available?.length ?? 0) !== permissions.length) return NextResponse.json({ message: "تم إرسال صلاحية غير صالحة." }, { status: 400 }); const { error } = await auth.admin.from("profiles").update({ full_name: fullName, role }).eq("id", targetId); if (error) return NextResponse.json({ message: error.message }, { status: 400 }); const { error: deleteError } = await auth.admin.from("user_permissions").delete().eq("user_id", targetId); if (deleteError) return NextResponse.json({ message: deleteError.message }, { status: 400 }); if (permissions.length) { const { error: insertError } = await auth.admin.from("user_permissions").insert(permissions.map((permission_key) => ({ user_id: targetId, permission_key }))); if (insertError) return NextResponse.json({ message: insertError.message }, { status: 400 }); } return NextResponse.json({ message: "تم تحديث بيانات وصلاحيات الموظف." }); }
  return NextResponse.json({ message: "إجراء غير معروف." }, { status: 400 });
}
