import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentAccess, hasActionPermission } from "@/lib/authorization";
import { apiSchemas, validateJson } from "@/lib/api-validation";
import { writeAuditLog } from "@/lib/audit-log";
import { createServiceClient } from "@/lib/supabase-server";

const allowedColumns = [
  "founder_name",
  "founder_description",
  "founder_image_url",
  "founder_contact_url",
  "contact_phone",
  "contact_address",
  "contact_whatsapp",
  "social_facebook",
  "social_twitter",
  "social_youtube",
  "maintenance_enabled",
  "maintenance_message",
  "maintenance_ends_at",
  "logo_url",
  "favicon_url",
  "live_streams",
] as const;

export async function GET() {
  const access = await getCurrentAccess();
  if (!access.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const canManageSettings = hasActionPermission(access, "settings.manage");
  const canManageLive = hasActionPermission(access, "live.edit");
  if (!canManageSettings && !canManageLive) return NextResponse.json({ error: "ليس لديك صلاحية التعديل" }, { status: 403 });

  const row = await createServiceClient().from("site_settings").select("*").eq("id", true).maybeSingle();
  if (row.error) return NextResponse.json({ error: row.error.message }, { status: 500 });
  return NextResponse.json({ settings: row.data ?? null });
}

export async function PUT(request: NextRequest) {
  const access = await getCurrentAccess();
  if (!access.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const canManageSettings = hasActionPermission(access, "settings.manage");
  const canManageLive = hasActionPermission(access, "live.edit");
  if (!canManageSettings && !canManageLive) return NextResponse.json({ error: "ليس لديك صلاحية التعديل" }, { status: 403 });

  const parsed = await validateJson(request, apiSchemas.settings);
  if ("response" in parsed) return parsed.response;
  const body = parsed.data;

  const patch: Record<string, unknown> = {};
  for (const key of allowedColumns) {
    if (key in body && (canManageSettings || key === "live_streams")) patch[key] = body[key];
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "مفيش بيانات للحفظ" }, { status: 400 });

  patch.updated_by = access.user.id;
  patch.updated_at = new Date().toISOString();

  const result = await createServiceClient().from("site_settings").update(patch).eq("id", true).select("id").maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "لم يتم العثور على صف الإعدادات" }, { status: 404 });
  await writeAuditLog({ actorId: access.user.id, action: "settings.update", request, targetType: "site_settings", targetId: "true", metadata: { keys: Object.keys(patch).filter((key) => !["updated_by", "updated_at"].includes(key)).join(",").slice(0, 500) } });
  return NextResponse.json({ ok: true, message: "تم حفظ الإعدادات بنجاح" });
}

export const dynamic = "force-dynamic";
