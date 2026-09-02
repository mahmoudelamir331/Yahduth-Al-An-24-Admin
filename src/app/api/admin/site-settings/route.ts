import { type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-route";

const allowedPermissions = ["settings.manage", "settings.maintenance", "settings.vip", "vip.manage"];
const selectColumns =
  "maintenance_enabled,maintenance_message,maintenance_ends_at,social_facebook,social_youtube,social_twitter,contact_phone,contact_address,contact_whatsapp,live_enabled,live_url,live_platform,content_protection_enabled,anti_adblock_enabled,updated_at";

async function ensureSettingsRow(admin: SupabaseClient) {
  const { data, error } = await admin
    .from("site_settings")
    .select(selectColumns)
    .eq("id", true)
    .maybeSingle();

  if (error) {
    return { error };
  }

  if (data) {
    return { data };
  }

  const { data: inserted, error: insertError } = await admin
    .from("site_settings")
    .upsert({ id: true }, { onConflict: "id" })
    .select(selectColumns)
    .single();

  if (insertError) {
    return { error: insertError };
  }

  return { data: inserted };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, { allowedPermissions });
  if ("error" in auth) return auth.error;

  const settings = await ensureSettingsRow(auth.admin);
  if ("error" in settings) {
    return NextResponse.json({ message: settings.error?.message ?? "تعذر تحميل الإعدادات." }, { status: 400 });
  }

  return NextResponse.json({ settings: settings.data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, { allowedPermissions });
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const hasMaintenanceEnabled = Object.prototype.hasOwnProperty.call(body, "maintenanceEnabled");
  const hasMaintenanceMessage = Object.prototype.hasOwnProperty.call(body, "maintenanceMessage");
  const hasMaintenanceEndsAt = Object.prototype.hasOwnProperty.call(body, "maintenanceEndsAt");
  const hasSocialFacebook = Object.prototype.hasOwnProperty.call(body, "socialFacebook");
  const hasSocialYoutube = Object.prototype.hasOwnProperty.call(body, "socialYoutube");
  const hasSocialTwitter = Object.prototype.hasOwnProperty.call(body, "socialTwitter");
  const hasContactPhone = Object.prototype.hasOwnProperty.call(body, "contactPhone");
  const hasContactAddress = Object.prototype.hasOwnProperty.call(body, "contactAddress");
  const hasContactWhatsapp = Object.prototype.hasOwnProperty.call(body, "contactWhatsapp");
  const hasLiveEnabled = Object.prototype.hasOwnProperty.call(body, "liveEnabled");
  const hasLiveUrl = Object.prototype.hasOwnProperty.call(body, "liveUrl");
  const hasLivePlatform = Object.prototype.hasOwnProperty.call(body, "livePlatform");
  const hasContentProtection = Object.prototype.hasOwnProperty.call(body, "contentProtectionEnabled");
  const hasAntiAdblock = Object.prototype.hasOwnProperty.call(body, "antiAdblockEnabled");

  const maintenanceEnabled =
    hasMaintenanceEnabled ? Boolean(body.maintenanceEnabled) : undefined;
  const maintenanceMessage =
    hasMaintenanceMessage
      ? typeof body.maintenanceMessage === "string" && body.maintenanceMessage.trim()
        ? body.maintenanceMessage.trim()
        : "الموقع تحت الصيانة حالياً. سنعود قريباً."
      : undefined;
  const maintenanceEndsAt =
    hasMaintenanceEndsAt
      ? typeof body.maintenanceEndsAt === "string" && body.maintenanceEndsAt.trim()
        ? body.maintenanceEndsAt.trim()
        : null
      : undefined;
  const socialFacebook =
    hasSocialFacebook
      ? typeof body.socialFacebook === "string"
        ? body.socialFacebook.trim() || null
        : null
      : undefined;
  const socialYoutube =
    hasSocialYoutube
      ? typeof body.socialYoutube === "string"
        ? body.socialYoutube.trim() || null
        : null
      : undefined;
  const socialTwitter =
    hasSocialTwitter
      ? typeof body.socialTwitter === "string"
        ? body.socialTwitter.trim() || null
        : null
      : undefined;
  const contactPhone =
    hasContactPhone ? (typeof body.contactPhone === "string" ? body.contactPhone.trim() || null : null) : undefined;
  const contactAddress =
    hasContactAddress ? (typeof body.contactAddress === "string" ? body.contactAddress.trim() || null : null) : undefined;
  const contactWhatsapp =
    hasContactWhatsapp ? (typeof body.contactWhatsapp === "string" ? body.contactWhatsapp.trim() || null : null) : undefined;
  const liveEnabled = hasLiveEnabled ? Boolean(body.liveEnabled) : undefined;
  const liveUrl = hasLiveUrl ? (typeof body.liveUrl === "string" ? body.liveUrl.trim() || null : null) : undefined;
  const livePlatform = hasLivePlatform ? (body.livePlatform === "facebook" ? "facebook" : "youtube") : undefined;
  const contentProtectionEnabled = hasContentProtection ? Boolean(body.contentProtectionEnabled) : undefined;
  const antiAdblockEnabled = hasAntiAdblock ? Boolean(body.antiAdblockEnabled) : undefined;

  const currentSettings = await ensureSettingsRow(auth.admin);
  if ("error" in currentSettings) {
    return NextResponse.json({ message: currentSettings.error?.message ?? "تعذر تحميل الإعدادات." }, { status: 400 });
  }

  const current = currentSettings.data;

  const { data, error } = await auth.admin
    .from("site_settings")
    .upsert(
      {
        id: true,
        maintenance_enabled: maintenanceEnabled ?? current.maintenance_enabled,
        maintenance_message: maintenanceMessage ?? current.maintenance_message,
        maintenance_ends_at:
          maintenanceEndsAt === undefined
            ? current.maintenance_ends_at ?? null
            : maintenanceEndsAt
              ? new Date(maintenanceEndsAt).toISOString()
              : null,
        social_facebook: socialFacebook !== undefined ? socialFacebook : current.social_facebook ?? null,
        social_youtube: socialYoutube !== undefined ? socialYoutube : current.social_youtube ?? null,
        social_twitter: socialTwitter !== undefined ? socialTwitter : current.social_twitter ?? null,
        contact_phone: contactPhone !== undefined ? contactPhone : current.contact_phone ?? null,
        contact_address: contactAddress !== undefined ? contactAddress : current.contact_address ?? null,
        contact_whatsapp: contactWhatsapp !== undefined ? contactWhatsapp : current.contact_whatsapp ?? null,
        live_enabled: liveEnabled ?? current.live_enabled ?? false,
        live_url: liveUrl !== undefined ? liveUrl : current.live_url ?? null,
        live_platform: livePlatform !== undefined ? livePlatform : current.live_platform ?? null,
        content_protection_enabled: contentProtectionEnabled ?? current.content_protection_enabled ?? false,
        anti_adblock_enabled: antiAdblockEnabled ?? current.anti_adblock_enabled ?? false,
      },
      { onConflict: "id" },
    )
    .select(selectColumns)
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: "تم حفظ الإعدادات بنجاح.", settings: data });
}
