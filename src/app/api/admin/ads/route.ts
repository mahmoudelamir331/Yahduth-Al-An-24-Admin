import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-route";

const allowedPermissions = ["ads.manage", "ads.create", "ads.toggle"];
const allowedPlacements = new Set(["header", "sidebar", "article", "bottom"]);
const allowedTypes = new Set(["image", "adsense"]);
const textField = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
};

function selectColumns() {
  return "id,name,placement,type,image_url,target_url,adsense_code,storage_path,is_active,starts_at,ends_at,created_at,updated_at";
}

function extractStoragePath(imageUrl: string | null) {
  if (!imageUrl) return null;

  try {
    const parsed = new URL(imageUrl);
    const marker = "/storage/v1/object/public/ads/";
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;
    return parsed.pathname.slice(index + marker.length);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, { allowedPermissions });
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.admin.from("ads").select(selectColumns()).order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({ ads: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, { allowedPermissions });
  if ("error" in auth) return auth.error;

  const form = await request.formData();
  const name = textField(form, "name");
  const placement = textField(form, "placement");
  const type = textField(form, "type");
  const targetUrl = textField(form, "targetUrl");
  const imageUrl = textField(form, "imageUrl");
  const adsenseCode = textField(form, "adsenseCode");
  const imageFile = form.get("imageFile");

  if (!name || !allowedPlacements.has(placement) || !allowedTypes.has(type)) {
    return NextResponse.json({ message: "بيانات الإعلان غير مكتملة أو غير صحيحة." }, { status: 400 });
  }

  let finalImageUrl: string | null = null;
  let storagePath: string | null = null;

  if (type === "image") {
    if (!targetUrl) {
      return NextResponse.json({ message: "رابط التحويل مطلوب في البنر الإعلاني." }, { status: 400 });
    }

    if (imageFile instanceof File && imageFile.size > 0) {
      const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      storagePath = `ads/${randomUUID()}-${safeName}`;
      const uploadResult = await auth.admin.storage.from("ads").upload(storagePath, imageFile, {
        cacheControl: "3600",
        contentType: imageFile.type || "application/octet-stream",
        upsert: false,
      });

      if (uploadResult.error) {
        return NextResponse.json({ message: uploadResult.error.message }, { status: 400 });
      }

      const { data: publicUrlData } = auth.admin.storage.from("ads").getPublicUrl(storagePath);
      finalImageUrl = publicUrlData.publicUrl;
    } else if (imageUrl) {
      finalImageUrl = imageUrl;
    } else {
      return NextResponse.json({ message: "ارفع صورة أو ضع رابط صورة صالح." }, { status: 400 });
    }
  }

  if (type === "adsense" && !adsenseCode) {
    return NextResponse.json({ message: "كود AdSense مطلوب." }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("ads")
    .insert({
      name,
      placement,
      type,
      image_url: type === "image" ? finalImageUrl : null,
      target_url: type === "image" ? targetUrl : null,
      adsense_code: type === "adsense" ? adsenseCode : null,
      storage_path: storagePath,
      is_active: true,
      created_by: auth.userId,
    })
    .select(selectColumns())
    .single();

  if (error) {
    if (storagePath) {
      await auth.admin.storage.from("ads").remove([storagePath]);
    }
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: "تمت إضافة الإعلان بنجاح.", ad: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, { allowedPermissions });
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  const isActive = typeof body.isActive === "boolean" ? body.isActive : null;

  if (!id) {
    return NextResponse.json({ message: "معرّف الإعلان مطلوب." }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("ads")
    .update(typeof isActive === "boolean" ? { is_active: isActive } : {})
    .eq("id", id)
    .select(selectColumns())
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: "تم تحديث حالة الإعلان.", ad: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request, { allowedPermissions });
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";

  if (!id) {
    return NextResponse.json({ message: "معرّف الإعلان مطلوب." }, { status: 400 });
  }

  const { data: currentAd, error: readError } = await auth.admin
    .from("ads")
    .select("id,image_url,storage_path")
    .eq("id", id)
    .single();

  if (readError || !currentAd) {
    return NextResponse.json({ message: "الإعلان غير موجود." }, { status: 404 });
  }

  const { error } = await auth.admin.from("ads").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  const storagePath = currentAd.storage_path ?? extractStoragePath(currentAd.image_url);
  if (storagePath) {
    await auth.admin.storage.from("ads").remove([storagePath]);
  }

  return NextResponse.json({ message: "تم حذف الإعلان." });
}
