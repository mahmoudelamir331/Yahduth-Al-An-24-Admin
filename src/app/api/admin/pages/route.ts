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

const pageFields = "slug,title,content,seo_title,seo_description,is_visible,is_system,updated_at";
const systemSlugs = new Set(["about", "contact", "privacy", "terms"]);

function revalidate(slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath("/", "layout");
}

export async function GET() {
  const auth = await requirePagesAccess();
  if ("response" in auth) return auth.response;
  const result = await createServiceClient()
    .from("site_pages")
    .select(pageFields)
    .order("slug");
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ pages: result.data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requirePagesAccess();
  if ("response" in auth) return auth.response;
  const parsed = await validateJson(request, apiSchemas.staticPageCreate);
  if ("response" in parsed) return parsed.response;
  const { slug, title, content, seo_title, seo_description, is_visible } = parsed.data;
  const result = await createServiceClient()
    .from("site_pages")
    .insert({
      slug,
      title,
      content: sanitizeCmsHtml(content ?? ""),
      seo_title: seo_title ?? title,
      seo_description: seo_description ?? null,
      is_visible: is_visible ?? true,
      is_system: false,
      updated_by: auth.access.user.id,
    })
    .select(pageFields)
    .single();
  if (result.error) return NextResponse.json({ error: result.error.code === "23505" ? "يوجد صفحة بنفس المعرف" : result.error.message }, { status: 400 });
  revalidate(slug);
  await writeAuditLog({ actorId: auth.access.user.id, action: "static_page.create", request, targetType: "site_page", targetId: slug });
  return NextResponse.json({ page: result.data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const auth = await requirePagesAccess();
  if ("response" in auth) return auth.response;
  const parsed = await validateJson(request, apiSchemas.staticPageUpdate);
  if ("response" in parsed) return parsed.response;
  const { slug } = parsed.data;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: auth.access.user.id };
  if (parsed.data.title !== undefined) patch.title = parsed.data.title.trim() || slug;
  if (parsed.data.content !== undefined) patch.content = sanitizeCmsHtml(parsed.data.content);
  if (parsed.data.seo_title !== undefined) patch.seo_title = parsed.data.seo_title;
  if (parsed.data.seo_description !== undefined) patch.seo_description = parsed.data.seo_description;
  if (parsed.data.is_visible !== undefined) patch.is_visible = parsed.data.is_visible;
  const result = await createServiceClient()
    .from("site_pages")
    .update(patch)
    .eq("slug", slug)
    .select(pageFields)
    .maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "الصفحة غير موجودة" }, { status: 404 });
  revalidate(slug);
  await writeAuditLog({ actorId: auth.access.user.id, action: "static_page.update", request, targetType: "site_page", targetId: slug });
  return NextResponse.json({ page: result.data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePagesAccess();
  if ("response" in auth) return auth.response;
  const parsed = await validateJson(request, apiSchemas.staticPageDelete);
  if ("response" in parsed) return parsed.response;
  const { slug } = parsed.data;
  if (systemSlugs.has(slug)) return NextResponse.json({ error: "لا يمكن حذف صفحة النظام، يمكن إخفاؤها فقط" }, { status: 400 });
  const result = await createServiceClient()
    .from("site_pages")
    .delete()
    .eq("slug", slug)
    .select("slug")
    .maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "الصفحة غير موجودة" }, { status: 404 });
  revalidatePath("/", "layout");
  await writeAuditLog({ actorId: auth.access.user.id, action: "static_page.delete", request, targetType: "site_page", targetId: slug });
  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
