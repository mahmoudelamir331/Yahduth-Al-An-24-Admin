import { NextResponse } from "next/server";
import { getCurrentAccess, hasActionPermission } from "@/lib/authorization";
import { createServiceClient } from "@/lib/supabase-server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getCurrentAccess();
  if (!access.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!hasActionPermission(access, "article.delete")) return NextResponse.json({ error: "ليس لديك صلاحية الحذف" }, { status: 403 });

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) return NextResponse.json({ error: "رقم الخبر غير صحيح" }, { status: 400 });

  const result = await createServiceClient().from("articles").delete().eq("id", numericId).select("id").maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "الخبر غير موجود" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
