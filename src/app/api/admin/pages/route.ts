import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireApiActionPermission } from "@/lib/authorization";
import { apiSchemas, validateJson } from "@/lib/api-validation";
import { writeAuditLog } from "@/lib/audit-log";
import { createServiceClient } from "@/lib/supabase-server";
import { sanitizeCmsHtml } from "@/lib/content-sanitizer";

async function requirePagesAccess() {
  const result = await requireApiActionPermission("settings.manage");
  if ("response" in result) return result;
  return result;
}

const allowedSlugs = new Set(["about", "contact", "privacy", "terms"]);

export async function GET() {
  const auth = await requirePagesAccess();
  if ("response" in auth) return auth.response;
  const result = await createServiceClient()
    .from("site_pages")
    .select("slug,title,content,updated_at")
    .order("slug");
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ pages: result.data ?? [] });
}

export async function PUT(request: NextRequest) {
  const auth = await requirePagesAccess();
  if ("response" in auth) return auth.response;
  const parsed = await validateJson(request, apiSchemas.staticPage);
  if ("response" in parsed) return parsed.response;
  const { slug } = parsed.data;
  if (!allowedSlugs.has(slug)) return NextResponse.json({ error: "معرف الصفحة غير صالح" }, { status: 400 });
  const title = parsed.data.title?.trim() || slug;
  const content = typeof parsed.data.content === "string" ? sanitizeCmsHtml(parsed.data.content) : "";
  const patch: Record<string, unknown> = { title, content, updated_at: new Date().toISOString(), updated_by: auth.access.user.id };
  const result = await createServiceClient()
    .from("site_pages")
    .upsert({ slug, ...patch }, { onConflict: "slug" })
    .select("slug,title,content,updated_at")
    .maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  revalidatePath(`/${slug}`);
  await writeAuditLog({ actorId: auth.access.user.id, action: "static_page.update", request, targetType: "site_page", targetId: slug });
  return NextResponse.json({ page: result.data });
}

export const dynamic = "force-dynamic";
