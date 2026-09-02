import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-route";

const banPermission = ["vip.manage"];

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, { allowedPermissions: banPermission });
  if ("error" in auth) return auth.error;
  const { data, error } = await auth.admin.from("banned_ips").select("id,ip_address,reason,is_active,created_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ bans: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, { allowedPermissions: banPermission });
  if ("error" in auth) return auth.error;
  const body = (await request.json()) as Record<string, unknown>;
  const ipAddress = typeof body.ipAddress === "string" ? body.ipAddress.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!ipAddress || !/^[0-9a-f:.]+$/i.test(ipAddress) || ipAddress.length > 64) {
    return NextResponse.json({ message: "رقم IP غير صحيح." }, { status: 400 });
  }
  const { data, error } = await auth.admin.from("banned_ips").insert({ ip_address: ipAddress, reason, created_by: auth.userId }).select("id,ip_address,reason,is_active,created_at").single();
  if (error) return NextResponse.json({ message: error.code === "23505" ? "الـ IP موجود بالفعل." : error.message }, { status: 400 });
  return NextResponse.json({ ban: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, { allowedPermissions: banPermission });
  if ("error" in auth) return auth.error;
  const body = (await request.json()) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ message: "بيانات الحظر ناقصة." }, { status: 400 });
  const { error } = await auth.admin.from("banned_ips").update({ is_active: Boolean(body.isActive) }).eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ message: "تم تحديث حالة الحظر." });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request, { allowedPermissions: banPermission });
  if ("error" in auth) return auth.error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ message: "بيانات الحظر ناقصة." }, { status: 400 });
  const { error } = await auth.admin.from("banned_ips").delete().eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ message: "تم حذف الـ IP من القائمة السوداء." });
}
