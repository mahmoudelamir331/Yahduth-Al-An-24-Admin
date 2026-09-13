import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireApiActionPermission } from "@/lib/authorization";
import { apiSchemas, validateJson } from "@/lib/api-validation";
import { writeAuditLog } from "@/lib/audit-log";
import { createServiceClient } from "@/lib/supabase-server";

const adFields = "id,title,image_url,target_url,custom_code,placement,ad_type,status,start_date,end_date,views,clicks,created_at,updated_at";

async function authorize(permission: "ads.create" | "ads.edit" | "ads.delete") {
  const result = await requireApiActionPermission(permission);
  if ("response" in result) return result;
  return result;
}

export async function GET() {
  const auth = await authorize("ads.edit");
  if ("response" in auth) return auth.response;
  const result = await createServiceClient().from("ads").select(adFields).order("created_at", { ascending: false });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ ads: result.data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await authorize("ads.create");
  if ("response" in auth) return auth.response;
  const parsed = await validateJson(request, apiSchemas.adCreate);
  if ("response" in parsed) return parsed.response;
  const body = parsed.data;
  const result = await createServiceClient().from("ads").insert({ ...body, created_by: auth.access.user.id }).select(adFields).single();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  await writeAuditLog({ actorId: auth.access.user.id, action: "ad.create", request, targetType: "ad", targetId: result.data.id });
  return NextResponse.json({ ad: result.data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await authorize("ads.edit");
  if ("response" in auth) return auth.response;
  const parsed = await validateJson(request, apiSchemas.adUpdate);
  if ("response" in parsed) return parsed.response;
  const { id, ...patch } = parsed.data;
  const result = await createServiceClient().from("ads").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select(adFields).maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  if (!result.data) return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
  await writeAuditLog({ actorId: auth.access.user.id, action: "ad.update", request, targetType: "ad", targetId: id });
  return NextResponse.json({ ad: result.data });
}

export async function DELETE(request: NextRequest) {
  const auth = await authorize("ads.delete");
  if ("response" in auth) return auth.response;
  const parsed = await validateJson(request, apiSchemas.adDelete);
  if ("response" in parsed) return parsed.response;
  const result = await createServiceClient().from("ads").delete().eq("id", parsed.data.id).select("id").maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  if (!result.data) return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
  await writeAuditLog({ actorId: auth.access.user.id, action: "ad.delete", request, targetType: "ad", targetId: parsed.data.id });
  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
