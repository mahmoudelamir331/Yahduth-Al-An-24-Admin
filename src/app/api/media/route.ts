import { NextResponse } from "next/server";
import { getCurrentAccess } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit-log";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxFileSize = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const access = await getCurrentAccess();
  if (!access.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!access.role) return NextResponse.json({ error: "ليس لديك صلاحية رفع الملفات" }, { status: 403 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "الملف غير متاح" }, { status: 400 });
  if (!allowedMimeTypes.has(file.type)) return NextResponse.json({ error: "يسمح برفع صور JPEG أو PNG أو WebP أو GIF فقط" }, { status: 400 });
  if (file.size === 0 || file.size > maxFileSize) return NextResponse.json({ error: "حجم الصورة يجب أن يكون بين 1 بايت و10 ميجابايت" }, { status: 400 });

  const isAdUpload = request.headers.get("x-upload-area") === "ads";
  const area = isAdUpload ? "ads" : "articles";

  let uploaded: { url: string; publicId: string };
  try {
    uploaded = await uploadImageToCloudinary(file, area);
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر رفع الصورة";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await writeAuditLog({ actorId: access.user.id, action: "media.upload", request, targetType: "cloudinary_asset", targetId: uploaded.publicId, metadata: { area, contentType: file.type, size: file.size } });
  return NextResponse.json({ path: uploaded.publicId, url: uploaded.url });
}

export const dynamic = "force-dynamic";
