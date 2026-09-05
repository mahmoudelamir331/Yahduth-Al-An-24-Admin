import { NextResponse } from "next/server";
import { getCurrentAccess, hasPermission } from "@/lib/authorization";
import { createClient } from "@/lib/supabase-server";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const maxFileSize = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const access = await getCurrentAccess();
  if (!access.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!hasPermission(access, "content") && !hasPermission(access, "ads")) return NextResponse.json({ error: "ليس لديك صلاحية رفع الملفات" }, { status: 403 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "الملف غير متاح" }, { status: 400 });
  if (!allowedMimeTypes.has(file.type)) return NextResponse.json({ error: "يسمح برفع صور JPEG أو PNG أو WebP أو GIF فقط" }, { status: 400 });
  if (file.size === 0 || file.size > maxFileSize) return NextResponse.json({ error: "حجم الصورة يجب أن يكون بين 1 بايت و10 ميجابايت" }, { status: 400 });

  const supabase = await createClient();
  const area = request.headers.get("x-upload-area") === "ads" ? "ads" : "articles";
  const path = `${area}/${crypto.randomUUID()}.${extensions[file.type]}`;
  const result = await supabase.storage.from("news-media").upload(path, file, { contentType: file.type, upsert: false });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ path, url: supabase.storage.from("news-media").getPublicUrl(path).data.publicUrl });
}

export const dynamic = "force-dynamic";
