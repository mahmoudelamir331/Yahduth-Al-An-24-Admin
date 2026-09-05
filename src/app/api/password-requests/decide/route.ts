import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { id?: unknown; action?: unknown; password?: unknown; reason?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const action = body?.action === "approve" || body?.action === "reject" ? body.action : null;
  if (!id || !action) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  const supabase = await createServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const permissions = await supabase.from("user_permissions").select("role").eq("user_id", user.id).maybeSingle();
  if ((permissions.data as { role?: string } | null)?.role !== "super_admin") {
    return NextResponse.json({ error: "هذه الصفحة للمدير العام فقط" }, { status: 403 });
  }

  const row = await supabase.from("password_reset_requests").select("id,email,status").eq("id", id).maybeSingle();
  const requestRecord = row.data as { id: string; email: string; status: string } | null;
  if (!requestRecord) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  if (requestRecord.status !== "pending") return NextResponse.json({ error: "تم التعامل مع هذا الطلب بالفعل" }, { status: 409 });

  if (action === "approve") {
    const finalPassword = typeof body?.password === "string" ? body.password.trim() : "";
    if (finalPassword.length < 8) return NextResponse.json({ error: "كلمة السر لازم تكون 8 حروف على الأقل" }, { status: 400 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) return NextResponse.json({ error: "إعدادات تغيير كلمة المرور غير مكتملة" }, { status: 500 });
    const admin = createAdminClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const listed = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listed.error) return NextResponse.json({ error: listed.error.message }, { status: 500 });
    const target = listed.data.users.find((candidate) => candidate.email?.toLowerCase() === requestRecord.email.toLowerCase());
    if (!target) return NextResponse.json({ error: "مفيش حساب بهذا الإيميل في Supabase Auth" }, { status: 404 });
    const changed = await admin.auth.admin.updateUserById(target.id, { password: finalPassword });
    if (changed.error) return NextResponse.json({ error: changed.error.message }, { status: 500 });

    const updated = await supabase.from("password_reset_requests").update({ status: "approved", proposed_password: "processed", rejection_reason: null, updated_at: new Date().toISOString() }).eq("id", id);
    if (updated.error) return NextResponse.json({ error: updated.error.message }, { status: 500 });
    return NextResponse.json({ status: "approved", message: "تم تغيير كلمة المرور. سلّمها للموظف بشكل آمن." });
  }

  const reason = typeof body?.reason === "string" && body.reason.trim() ? body.reason.trim() : "تم رفض الطلب";
  const updated = await supabase.from("password_reset_requests").update({ status: "rejected", rejection_reason: reason, updated_at: new Date().toISOString() }).eq("id", id);
  if (updated.error) return NextResponse.json({ error: updated.error.message }, { status: 500 });
  return NextResponse.json({ status: "rejected", message: "تم رفض الطلب" });
}

export const dynamic = "force-dynamic";
