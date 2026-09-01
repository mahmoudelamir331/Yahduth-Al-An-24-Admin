import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const permittedRoles = ["manager", "editor", "advertiser"];

async function authorize(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) return { error: NextResponse.json({ message: "إعدادات الخادم ناقصة." }, { status: 500 }) };
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return { error: NextResponse.json({ message: "انتهت جلسة تسجيل الدخول." }, { status: 401 }) };
  const authClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: authData } = await authClient.auth.getUser();
  if (!authData.user) return { error: NextResponse.json({ message: "انتهت جلسة تسجيل الدخول." }, { status: 401 }) };
  const admin = createClient(url, serviceKey);
  const { data: requester } = await admin.from("profiles").select("role, is_active").eq("id", authData.user.id).single();
  if (!requester?.is_active || requester.role !== "super_admin") return { error: NextResponse.json({ message: "غير مسموح لك بإدارة الفريق." }, { status: 403 }) };
  return { admin, userId: authData.user.id };
}

function validPermissions(body: Record<string, unknown>) { return Array.isArray(body.permissions) ? body.permissions.filter((item: unknown): item is string => typeof item === "string") : []; }

export async function POST(request: NextRequest) {
  const auth = await authorize(request); if (auth.error) return auth.error;
  const body = await request.json() as Record<string, unknown>;
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = typeof body.role === "string" ? body.role : "";
  const permissions = validPermissions(body);
  if (!fullName || !email || password.length < 8 || !permittedRoles.includes(role)) return NextResponse.json({ message: "راجع بيانات الموظف وكلمة المرور (8 حروف على الأقل)." }, { status: 400 });
  const { data: available } = await auth.admin.from("permissions").select("key").in("key", permissions);
  if ((available?.length ?? 0) !== permissions.length) return NextResponse.json({ message: "تم إرسال صلاحية غير صالحة." }, { status: 400 });
  const { data: created, error: createError } = await auth.admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (createError || !created.user) return NextResponse.json({ message: createError?.message ?? "تعذر إنشاء الحساب." }, { status: 400 });
  const { error: profileError } = await auth.admin.from("profiles").insert({ id: created.user.id, full_name: fullName, role, is_active: true });
  if (profileError) { await auth.admin.auth.admin.deleteUser(created.user.id); return NextResponse.json({ message: "تعذر حفظ ملف الموظف." }, { status: 500 }); }
  if (permissions.length) await auth.admin.from("user_permissions").insert(permissions.map((permission_key) => ({ user_id: created.user.id, permission_key })));
  return NextResponse.json({ message: "تمت إضافة الموظف وتحديد صلاحياته." }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await authorize(request); if (auth.error) return auth.error;
  const body = await request.json() as Record<string, unknown>;
  const targetId = typeof body.targetId === "string" ? body.targetId : "";
  const action = typeof body.action === "string" ? body.action : "";
  if (!targetId || targetId === auth.userId) return NextResponse.json({ message: "لا يمكن تعديل حسابك من هنا." }, { status: 400 });
  if (action === "delete") { const { error } = await auth.admin.auth.admin.deleteUser(targetId); if (error) return NextResponse.json({ message: "تعذر حذف الموظف." }, { status: 400 }); return NextResponse.json({ message: "تم حذف الموظف نهائياً." }); }
  if (action === "password") { const password = typeof body.password === "string" ? body.password : ""; if (password.length < 8) return NextResponse.json({ message: "كلمة المرور لازم تكون 8 حروف على الأقل." }, { status: 400 }); const { error } = await auth.admin.auth.admin.updateUserById(targetId, { password }); if (error) return NextResponse.json({ message: "تعذر تغيير كلمة المرور." }, { status: 400 }); return NextResponse.json({ message: "تم تغيير كلمة المرور." }); }
  if (action === "status") { const { data: current } = await auth.admin.from("profiles").select("is_active").eq("id", targetId).single(); const { error } = await auth.admin.from("profiles").update({ is_active: !current?.is_active }).eq("id", targetId); if (error) return NextResponse.json({ message: "تعذر تغيير حالة الحساب." }, { status: 400 }); return NextResponse.json({ message: current?.is_active ? "تم إيقاف الحساب." : "تم تفعيل الحساب." }); }
  if (action === "update") { const fullName = typeof body.fullName === "string" ? body.fullName.trim() : ""; const role = typeof body.role === "string" ? body.role : ""; const permissions = validPermissions(body); if (!fullName || !permittedRoles.includes(role)) return NextResponse.json({ message: "راجع اسم الموظف ودوره." }, { status: 400 }); const { error } = await auth.admin.from("profiles").update({ full_name: fullName, role }).eq("id", targetId); if (error) return NextResponse.json({ message: "تعذر تعديل بيانات الموظف." }, { status: 400 }); await auth.admin.from("user_permissions").delete().eq("user_id", targetId); if (permissions.length) await auth.admin.from("user_permissions").insert(permissions.map((permission_key) => ({ user_id: targetId, permission_key }))); return NextResponse.json({ message: "تم تحديث بيانات وصلاحيات الموظف." }); }
  return NextResponse.json({ message: "إجراء غير معروف." }, { status: 400 });
}
