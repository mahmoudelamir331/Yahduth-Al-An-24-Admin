import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const permittedRoles = ["manager", "editor", "advertiser"];

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) return NextResponse.json({ message: "إعدادات الخادم ناقصة." }, { status: 500 });

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ message: "انتهت جلسة تسجيل الدخول." }, { status: 401 });
  const authClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const response = await authClient.auth.getUser();
  const user = response.data.user;
  if (!user) return NextResponse.json({ message: "انتهت جلسة تسجيل الدخول." }, { status: 401 });

  const admin = createClient(url, serviceKey);
  const { data: requester } = await admin.from("profiles").select("role, is_active").eq("id", user.id).single();
  if (!requester?.is_active || requester.role !== "super_admin") return NextResponse.json({ message: "غير مسموح لك بإدارة الفريق." }, { status: 403 });

  const body = await request.json();
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = typeof body.role === "string" ? body.role : "";
  const permissions: string[] = Array.isArray(body.permissions) ? body.permissions.filter((item: unknown): item is string => typeof item === "string") : [];
  if (!fullName || !email || password.length < 8 || !permittedRoles.includes(role)) return NextResponse.json({ message: "راجع بيانات الموظف وكلمة المرور (8 حروف على الأقل)." }, { status: 400 });

  const { data: available } = await admin.from("permissions").select("key").in("key", permissions);
  if ((available?.length ?? 0) !== permissions.length) return NextResponse.json({ message: "تم إرسال صلاحية غير صالحة." }, { status: 400 });
  const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (createError || !created.user) return NextResponse.json({ message: createError?.message ?? "تعذر إنشاء الحساب." }, { status: 400 });

  const { error: profileError } = await admin.from("profiles").insert({ id: created.user.id, full_name: fullName, role, is_active: true });
  if (profileError) { await admin.auth.admin.deleteUser(created.user.id); return NextResponse.json({ message: "تعذر حفظ ملف الموظف." }, { status: 500 }); }
  if (permissions.length) await admin.from("user_permissions").insert(permissions.map((permission_key: string) => ({ user_id: created.user.id, permission_key })));
  return NextResponse.json({ message: "تمت إضافة الموظف وتحديد صلاحياته." }, { status: 201 });
}
