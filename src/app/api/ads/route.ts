import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireApiActionPermission } from "@/lib/authorization";
import { createServiceClient } from "@/lib/supabase-server";

type Ad = { id: string; title: string; url: string; active: boolean };

async function authorize() {
  const result = await requireApiActionPermission("ads.edit");
  if ("response" in result) return result;
  return result;
}

async function readAds(): Promise<{ ads: Ad[]; error?: string }> {
  const result = await createServiceClient().from("site_settings").select("ads").eq("id", true).maybeSingle();
  if (result.error) return { ads: [], error: result.error.message };
  const value = result.data?.ads;
  return { ads: Array.isArray(value) ? value as Ad[] : Array.isArray(value?.items) ? value.items as Ad[] : [] };
}

export async function GET() {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const result = await readAds();
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ads: result.ads });
}

export async function POST(request: NextRequest) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!title) return NextResponse.json({ error: "عنوان الإعلان مطلوب" }, { status: 400 });
  const current = await readAds();
  if (current.error) return NextResponse.json({ error: current.error }, { status: 500 });
  const ad: Ad = { id: crypto.randomUUID(), title, url, active: true };
  const result = await createServiceClient().from("site_settings").update({ ads: [...current.ads, ad], updated_by: auth.access.user.id, updated_at: new Date().toISOString() }).eq("id", true);
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ ad }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "معرف الإعلان مطلوب" }, { status: 400 });
  const current = await readAds();
  if (current.error) return NextResponse.json({ error: current.error }, { status: 500 });
  const result = await createServiceClient().from("site_settings").update({ ads: current.ads.filter((ad) => ad.id !== body.id), updated_by: auth.access.user.id, updated_at: new Date().toISOString() }).eq("id", true);
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
