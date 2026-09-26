import { createHash } from "node:crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export function isCloudinaryConfigured() {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** يرفع ملف صورة إلى Cloudinary ويرجع الرابط العام. */
export async function uploadImageToCloudinary(file: File, area: string): Promise<{ url: string; publicId: string }> {
  if (!isCloudinaryConfigured()) {
    throw new Error("إعدادات Cloudinary غير مكتملة (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET)");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `yahduth/${area}`;
  const publicId = `${folder}/${timestamp}_${crypto.randomUUID()}`;

  const signature = createHash("sha1")
    .update(`folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`)
    .digest("hex");

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: file.type }), `upload.${extensions[file.type] ?? "jpg"}`);
  form.append("api_key", API_KEY as string);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("public_id", publicId);
  form.append("signature", signature);
  form.append("overwrite", "false");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });

  const payload = (await response.json()) as { secure_url?: string; public_id?: string; error?: { message?: string } };
  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message ?? "تعذر رفع الصورة إلى Cloudinary");
  }

  return { url: payload.secure_url, publicId: payload.public_id ?? publicId };
}
