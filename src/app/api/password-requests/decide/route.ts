import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiSchemas, validateJson } from "@/lib/api-validation";
import { writeAuditLog } from "@/lib/audit-log";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient as createServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const parsed = await validateJson(request, apiSchemas.passwordDecision);
  if ("response" in parsed) return parsed.response;
  const { id, action } = parsed.data;

  const permission = await supabase.from("user_permissions").select("role").eq("user_id", user.id).maybeSingle();
  if ((permission.data as { role?: string } | null)?.role !== "super_admin") {
    return NextResponse.json({ error: "هذه العملية للمدير العام فقط" }, { status: 403 });
  }

  const row = await supabase.from("password_reset_requests").select("id,email,status").eq("id", id).maybeSingle();
  const resetRequest = row.data as { id: string; email: string; status: string } | null;
  if (!resetRequest) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  if (resetRequest.status !== "pending") return NextResponse.json({ error: "تم التعامل مع هذا الطلب بالفعل" }, { status: 409 });

  if (action === "approve") {
    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return NextResponse.json({ error: "إعدادات استعادة كلمة المرور غير مكتملة" }, { status: 500 });
    }

    // Supabase owns the one-time recovery token and sends it directly to the
    // account email. No password or reset token traverses the admin browser.
    const sent = await admin.auth.resetPasswordForEmail(resetRequest.email, {
      redirectTo: new URL("/reset-password", request.url).toString(),
    });
    if (sent.error) return NextResponse.json({ error: "تعذر إرسال رابط الاستعادة" }, { status: 500 });

    const updated = await supabase.from("password_reset_requests").update({
      status: "approved",
      rejection_reason: null,
      reset_email_sent_at: new Date().toISOString(),
      reset_email_sent_by: user.id,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (updated.error) return NextResponse.json({ error: "تعذر تحديث الطلب" }, { status: 500 });
    await writeAuditLog({ actorId: user.id, action: "password_request.approve", request, targetType: "password_reset_request", targetId: id });
    return NextResponse.json({ status: "approved", message: "تم إرسال رابط استعادة آمن إلى البريد المسجل." });
  }

  const reason = parsed.data.reason?.trim() || "تم رفض الطلب";
  const updated = await supabase.from("password_reset_requests").update({
    status: "rejected",
    rejection_reason: reason,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (updated.error) return NextResponse.json({ error: "تعذر تحديث الطلب" }, { status: 500 });
  await writeAuditLog({ actorId: user.id, action: "password_request.reject", request, targetType: "password_reset_request", targetId: id });
  return NextResponse.json({ status: "rejected", message: "تم رفض الطلب" });
}

export const dynamic = "force-dynamic";
