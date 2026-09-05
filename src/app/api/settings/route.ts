import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentAccess, hasPermission } from "@/lib/authorization";
import { createClient } from "@/lib/supabase-server";

// قراءة/حفظ إعدادات الموقع من جدول site_settings — لصاحب الصلاحية فقط
export async function GET() {
  const access = await getCurrentAccess();
  if (!access.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!hasPermission(access, "settings")) return NextResponse.json({ error: "ليس لديك صلاحية التعديل" }, { status: 403 });
  const supabase = await createClient();
  const row = await supabase.from("site_settings").select("*").eq("id", true).maybeSingle();
  if (row.error) return NextResponse.json({ error: row.error.message }, { status: 500 });
  return NextResponse.json({ settings: row.data ?? null });
}

export async function PUT(request: NextRequest) {
  const access = await getCurrentAccess();
  if (!access.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!hasPermission(access, "settings")) return NextResponse.json({ error: "ليس لديك صلاحية التعديل" }, { status: 403 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "بيانات الحفظ غير صحيحة" }, { status: 400 });
  // الأعمدة المسموح بها فقط — الحماية من كتابة أعمدة غريبة
  const allowedColumns = ["founder_name", "founder_description", "founder_image_url", "founder_contact_url", "contact_phone", "contact_address", "contact_whatsapp", "social_facebook", "social_twitter", "social_youtube", "live_streams", "maintenance_enabled", "maintenance_message", "maintenance_ends_at", "content_protection_enabled", "anti_adblock_enabled", "ads"];
  const patch: Record<string, unknown> = {};
  for (const key of allowedColumns) if (key in body) patch[key] = body[key];
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "مفيش بيانات للحفظ" }, { status: 400 });
  patch.updated_by = access.user.id;
  patch.updated_at = new Date().toISOString();

  const supabase = await createClient();
  const result = await supabase.from("site_settings").update(patch).eq("id", true).select("id").maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "لم يتم العثور على صف الإعدادات (id=true)" }, { status: 404 });
  return NextResponse.json({ ok: true, message: "تم حفظ الإعدادات بنجاح" });
}

export const dynamic = "force-dynamic";
