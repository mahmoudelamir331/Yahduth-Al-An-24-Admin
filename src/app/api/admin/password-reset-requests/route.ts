import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-route";

function key() { return createHash("sha256").update(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").digest(); }
function encrypt(value: string) { const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key(), iv); const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]); return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`; }
function decrypt(value: string) { const [iv, tag, data] = value.split("."); const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url")); decipher.setAuthTag(Buffer.from(tag, "base64url")); return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8"); }
function json(message: string, status = 400) { return NextResponse.json({ message }, { status }); }

async function findUser(admin: { auth: { admin: { listUsers: (options: { page: number; perPage: number }) => Promise<{ data: { users: Array<{ id: string; email?: string }> } }> } } }, email: string) {
  const result = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return result.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return json("إعدادات الخادم ناقصة.", 500);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const body = await request.json() as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!name || !email || password.length < 8) return json("اكتب الاسم والبريد وكلمة مرور من 8 أحرف على الأقل.");
  const user = await findUser(admin, email);
  if (!user) return json("لا يوجد موظف بهذا البريد الإلكتروني.", 404);
  const profile = await admin.from("profiles").select("id,full_name,is_active").eq("id", user.id).single();
  if (!profile.data?.is_active || profile.data.full_name.trim() !== name) return json("بيانات الموظف غير مطابقة.", 403);
  const { data: previous } = await admin.from("password_reset_requests").select("id,status,rejection_reason,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
  const { error } = await admin.from("password_reset_requests").insert({ user_id: user.id, requested_password_hash: null, requested_password_ciphertext: encrypt(password), status: "pending" });
  if (error) return json("تعذر إرسال طلب كلمة السر: " + error.message, 500);
  return NextResponse.json({ message: "تم إرسال الطلب للمراجعة.", previous: previous ?? [] }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, { allowedPermissions: ["team.manage", "users.manage"] });
  if ("error" in auth) return auth.error;
  const { data, error } = await auth.admin.from("password_reset_requests").select("id,user_id,status,rejection_reason,created_at,profiles(full_name)").order("created_at", { ascending: false });
  if (error) return json(error.message, 500);
  const users = await auth.admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailById = new Map(users.data.users.map((user) => [user.id, user.email ?? ""]));
  return NextResponse.json((data ?? []).map((item) => ({ ...item, email: emailById.get(item.user_id) ?? "" })));
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, { allowedPermissions: ["team.manage", "users.manage"] });
  if ("error" in auth) return auth.error;
  const body = await request.json() as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  const status = body.status === "approved" || body.status === "rejected" ? body.status : "";
  if (!id || !status) return json("الطلب أو الحالة غير صحيحة.");
  const { data: item } = await auth.admin.from("password_reset_requests").select("id,user_id,status,requested_password_ciphertext").eq("id", id).single();
  if (!item || item.status !== "pending") return json("الطلب غير موجود أو تمت مراجعته بالفعل.", 404);
  if (status === "approved") {
    if (!item.requested_password_ciphertext) return json("الطلب لا يحتوي على كلمة سر مشفرة.", 400);
    let password = ""; try { password = decrypt(item.requested_password_ciphertext); } catch { return json("تعذر فك تشفير الطلب.", 500); }
    const result = await auth.admin.auth.admin.updateUserById(item.user_id, { password });
    if (result.error) return json(result.error.message, 400);
  }
  const rejectionReason = typeof body.reason === "string" ? body.reason.trim() : null;
  if (status === "rejected" && !rejectionReason) return json("اكتب سبب رفض الطلب.");
  const { error } = await auth.admin.from("password_reset_requests").update({ status, rejection_reason: status === "rejected" ? rejectionReason : null, reviewed_by: auth.userId, reviewed_at: new Date().toISOString() }).eq("id", id);
  if (error) return json(error.message, 500);
  return NextResponse.json({ message: status === "approved" ? "تم اعتماد كلمة السر." : "تم رفض الطلب." });
}
