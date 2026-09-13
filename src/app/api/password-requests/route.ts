import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiSchemas, validateJson } from "@/lib/api-validation";
import { writeAuditLog } from "@/lib/audit-log";
import { createAdminClient } from "@/lib/supabase-admin";

const pendingMessage = "تم استلام الطلب. لو البيانات صحيحة، هيراجعه المدير العام.";

export async function POST(request: NextRequest) {
  const parsed = await validateJson(request, apiSchemas.passwordRequest);
  if ("response" in parsed) return parsed.response;
  const email = parsed.data.email.toLowerCase();

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: "إعدادات الخدمة غير مكتملة" }, { status: 500 });
  }
  const existing = await supabase.from("password_reset_requests").select("status").eq("email", email).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existing.error) return NextResponse.json({ error: "تعذر استلام الطلب" }, { status: 500 });
  if ((existing.data as { status?: string } | null)?.status === "pending") {
    await writeAuditLog({ actorId: null, action: "password_request.duplicate", request, targetType: "password_reset_request" });
    return NextResponse.json({ status: "pending", message: pendingMessage });
  }

  const inserted = await supabase.from("password_reset_requests").insert({ email, status: "pending", rejection_reason: null }).select("id").maybeSingle();
  if (inserted.error) return NextResponse.json({ error: "تعذر استلام الطلب" }, { status: 500 });
  await writeAuditLog({ actorId: null, action: "password_request.create", request, targetType: "password_reset_request", targetId: (inserted.data as { id?: string } | null)?.id ?? null });
  return NextResponse.json({ status: "pending", message: pendingMessage });
}

export const dynamic = "force-dynamic";
