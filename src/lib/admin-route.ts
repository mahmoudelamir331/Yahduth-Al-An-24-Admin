import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type AuthSuccess = { admin: SupabaseClient; userId: string };
type AuthFailure = { error: NextResponse };

type RequireAdminOptions = {
  allowedPermissions?: string[];
  allowInactiveProfile?: boolean;
};

function missingEnvResponse() {
  return NextResponse.json(
    {
      message:
        "إعدادات الخادم ناقصة. تأكد من وجود NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY و SUPABASE_SERVICE_ROLE_KEY داخل .env.local.",
    },
    { status: 500 },
  );
}

function unauthorizedResponse() {
  return NextResponse.json({ message: "انتهت جلسة تسجيل الدخول." }, { status: 401 });
}

function forbiddenResponse() {
  return NextResponse.json({ message: "غير مسموح لك بتنفيذ هذا الإجراء." }, { status: 403 });
}

export async function requireAdmin(
  request: NextRequest,
  options: RequireAdminOptions = {},
): Promise<AuthSuccess | AuthFailure> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    return { error: missingEnvResponse() };
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return { error: unauthorizedResponse() };
  }

  const authClient = createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: authData, error: authError } = await authClient.auth.getUser();
  if (authError || !authData.user) {
    return { error: unauthorizedResponse() };
  }

  const admin = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const [{ data: profile, error: profileError }, { data: permissionRows, error: permissionError }] =
    await Promise.all([
      admin.from("profiles").select("role, is_active").eq("id", authData.user.id).single(),
      options.allowedPermissions?.length
        ? admin.from("user_permissions").select("permission_key").eq("user_id", authData.user.id)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (profileError || !profile) {
    return { error: unauthorizedResponse() };
  }

  if (!options.allowInactiveProfile && !profile.is_active) {
    return { error: forbiddenResponse() };
  }

  if (profile.role !== "super_admin" && options.allowedPermissions?.length) {
    if (permissionError) {
      return { error: forbiddenResponse() };
    }

    const ownedPermissions = new Set((permissionRows ?? []).map((row) => row.permission_key));
    const allowed = options.allowedPermissions.some((permission) => ownedPermissions.has(permission));

    if (!allowed) {
      return { error: forbiddenResponse() };
    }
  }

  return { admin, userId: authData.user.id };
}
