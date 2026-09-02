import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-route";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  const [{ data: profile, error: profileError }, { data: rows, error: permissionsError }] = await Promise.all([
    auth.admin.from("profiles").select("id,full_name,role,is_active").eq("id", auth.userId).single(),
    auth.admin.from("user_permissions").select("permission_key").eq("user_id", auth.userId),
  ]);
  if (profileError || permissionsError || !profile) return NextResponse.json({ message: "تعذر تحميل بيانات الموظف وصلاحياته." }, { status: 500 });
  return NextResponse.json({ profile, permissions: (rows ?? []).map((row) => row.permission_key) });
}
