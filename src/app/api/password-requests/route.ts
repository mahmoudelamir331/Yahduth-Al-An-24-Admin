import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const pendingMessage = "تم استلام الطلب. لو البيانات صحيحة، هيراجعه المدير العام.";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) return NextResponse.json({ error: "أدخل بريدًا إلكترونيًا صحيحًا" }, { status: 400 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) return NextResponse.json({ error: "إعدادات الخدمة غير مكتملة" }, { status: 500 });

  const supabase = createAdminClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const existing = await supabase.from("password_reset_requests").select("status").eq("email", email).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existing.error) return NextResponse.json({ error: "تعذر استلام الطلب" }, { status: 500 });
  if ((existing.data as { status?: string } | null)?.status === "pending") {
    return NextResponse.json({ status: "pending", message: pendingMessage });
  }

  const inserted = await supabase.from("password_reset_requests").insert({ email, proposed_password: "approval-required", status: "pending", rejection_reason: null });
  if (inserted.error) return NextResponse.json({ error: "تعذر استلام الطلب" }, { status: 500 });
  return NextResponse.json({ status: "pending", message: pendingMessage });
}

export const dynamic = "force-dynamic";
