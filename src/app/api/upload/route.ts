import { NextResponse } from "next/server";
import { getCurrentAccess } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit-log";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  // Any authenticated team member (Super Admin + Staff) may upload images.
  const access = await getCurrentAccess();
  if (!access.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!access.role) return NextResponse.json({ error: "ليس لديك صلاحية رفع الصور" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "الملف غير موجود" }, { status: 400 });
  if (!allowedMimeTypes.has(file.type)) return NextResponse.json({ error: "صيغة الصورة غير مدعومة" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "حجم الصورة يتجاوز 5 ميجابايت" }, { status: 400 });

  const area = (form?.get("area") as string) === "ads" ? "ads" : "articles";

  let uploaded: { url: string; publicId: string };
  try {
    uploaded = await uploadImageToCloudinary(file, area);
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر رفع الصورة";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await writeAuditLog({ actorId: access.user.id, action: "media.upload", request, targetType: "cloudinary_asset", targetId: uploaded.publicId, metadata: { area, contentType: file.type, size: file.size } });
  return NextResponse.json({ url: uploaded.url, path: uploaded.publicId });
}

export const dynamic = "force-dynamic";
