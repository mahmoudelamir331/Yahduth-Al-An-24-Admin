import { createHash } from "node:crypto";

export type CloudinaryConfig = {
  cloud_name: string;
  api_key: string;
  api_secret: string;
};

/** بيشيل أي مسافات زائدة أو أسطر جديدة جوّه المتغيرات. */
function normalize(value: string | undefined | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * بيقرا الإعدادات وقت الاستدعاء (مش وقت تحميل الموديول)، ويقبل
 * CLOUDINARY_URL أو المتغيرات المنفصلة.
 */
export function getCloudinaryConfig(): CloudinaryConfig | null {
  // 1) CLOUDINARY_URL بياخد الأولوية: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
  const url = normalize(process.env.CLOUDINARY_URL);
  if (url) {
    try {
      const parsed = new URL(url);
      const cloudName = normalize(parsed.hostname);
      const apiKey = normalize(decodeURIComponent(parsed.username));
      const apiSecret = normalize(decodeURIComponent(parsed.password));
      if (cloudName && apiKey && apiSecret) {
        return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret };
      }
    } catch {
      // CLOUDINARY_URL مش صالح -> هنكمل بالمتغيرات المنفصلة
    }
  }

  // 2) المتغيرات المنفصلة
  const cloudName =
    normalize(process.env.CLOUDINARY_CLOUD_NAME) ??
    normalize(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
  const apiKey = normalize(process.env.CLOUDINARY_API_KEY);
  const apiSecret = normalize(process.env.CLOUDINARY_API_SECRET);

  if (cloudName && apiKey && apiSecret) {
    return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret };
  }

  return null;
}

export function isCloudinaryConfigured(): boolean {
  return getCloudinaryConfig() !== null;
}

/** رسالة واضحة عمّيها المتغير الناقص. */
function missingEnvMessage(): string {
  const missing: string[] = [];
  const hasUrl = Boolean(normalize(process.env.CLOUDINARY_URL));
  if (!hasUrl && !normalize(process.env.CLOUDINARY_CLOUD_NAME) && !normalize(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)) missing.push("CLOUDINARY_CLOUD_NAME");
  if (!hasUrl && !normalize(process.env.CLOUDINARY_API_KEY)) missing.push("CLOUDINARY_API_KEY");
  if (!hasUrl && !normalize(process.env.CLOUDINARY_API_SECRET)) missing.push("CLOUDINARY_API_SECRET");
  if (missing.length === 0) missing.push("CLOUDINARY_URL (القيمة دي ناقصة أو غير صالحة)");
  return `إعدادات Cloudinary غير مكتملة. المتغيرات الناقصة: ${missing.join("، ")}`;
}

/**
 * توقيع الرفع: sha1 لكل المتغيرات المُوقَّعة مرتبة أبجديًا ومتصولة بـ &،
 * وبعدها api_secret من غير فاصل — وده بالظبط اللي بيعمله Cloudinary SDK.
 */
function signParams(params: Record<string, string>, apiSecret: string): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1")
    .update(`${payload}${apiSecret}`, "utf8")
    .digest("hex");
}

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** يرفع ملف صورة إلى Cloudinary ويرجع الرابط العام. */
export async function uploadImageToCloudinary(file: File, area: string): Promise<{ url: string; publicId: string }> {
  // 1) التهيئة بتتقرأ فورًا قبل أي خطوة تانية
  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error(missingEnvMessage());
  }

  const { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret } = config;

  // 2) تجهيز البيانات
  const buffer = Buffer.from(await file.arrayBuffer());
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `yahduth/${area}`;
  // public_id بيتحسب جوه الـ folder، فميتبعتش المسار مرتين
  const publicId = `${timestamp}_${crypto.randomUUID()}`;

  // 3) التوقيع بيتحسب مباشرة من نفس المتغيرات اللي هتبعت
  const params: Record<string, string> = {
    timestamp: String(timestamp),
    folder,
    public_id: publicId,
  };
  const signature = signParams(params, apiSecret);

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: file.type }), `upload.${extensions[file.type] ?? "jpg"}`);
  form.append("api_key", apiKey);
  form.append("timestamp", params.timestamp);
  form.append("folder", params.folder);
  form.append("public_id", params.public_id);
  form.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  };
  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message ?? "تعذر رفع الصورة إلى Cloudinary");
  }

  return { url: payload.secure_url, publicId: payload.public_id ?? publicId };
}
