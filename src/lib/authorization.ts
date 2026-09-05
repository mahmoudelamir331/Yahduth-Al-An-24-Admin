import { redirect } from "next/navigation";
import { createClient as createServiceClient, type User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server";

export const adminPermissions = ["dashboard", "content", "live", "ads", "settings", "team", "profile", "passwordRequests"] as const;
export type AdminPermission = (typeof adminPermissions)[number];
type PermissionRecord = Record<string, boolean>;

type PermissionValue = Record<string, unknown> | string[] | null | undefined;
function normalizePermissions(value: PermissionValue): PermissionRecord {
  if (Array.isArray(value)) return Object.fromEntries(value.filter((key): key is string => typeof key === "string").map(key => [key, true]));
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).filter(([, enabled]) => enabled === true || enabled === "true" || enabled === 1).map(([key]) => [key, true]));
}
export type AdminAccess = {
  user: User | null;
  role: string | null;
  permissions: PermissionRecord;
  navigationPermissions: Record<AdminPermission, boolean>;
};

const permissionAliases: Record<AdminPermission, string[]> = {
  dashboard: ["dashboard", "view_dashboard"],
  content: ["content", "manage_content", "article.create", "article.edit", "article.delete", "categories.manage"],
  live: ["live", "manage_live", "live.start", "live.edit", "live.stop"],
  ads: ["ads", "manage_ads", "ads.create", "ads.edit", "ads.delete"],
  settings: ["settings", "manage_settings", "settings.manage"],
  team: ["team", "manage_team", "team.add", "team.permissions"],
  profile: ["profile", "view_profile"],
  passwordRequests: ["passwordRequests", "password_requests"],
};

function allNavigationPermissions() {
  return Object.fromEntries(adminPermissions.map((permission) => [permission, true])) as Record<AdminPermission, boolean>;
}

export function hasPermission(access: Pick<AdminAccess, "role" | "permissions">, permission: AdminPermission) {
  // Every authenticated staff member with a valid role needs a safe landing page
  // and access to their own profile; all other sections remain permission-gated.
  if (permission === "dashboard" || permission === "profile") return Boolean(access.role);
  return access.role === "super_admin" || permissionAliases[permission].some((alias) => access.permissions[alias] === true);
}

function getNavigationPermissions(role: string | null, permissions: PermissionRecord) {
  if (role === "super_admin") return allNavigationPermissions();
  return Object.fromEntries(adminPermissions.map((permission) => [permission, hasPermission({ role, permissions }, permission)])) as Record<AdminPermission, boolean>;
}

export async function getCurrentAccess(): Promise<AdminAccess> {
  const supabase = await createClient();
  const authResult = await supabase.auth.getUser();
  const user = authResult.data.user;
  if (!user) return { user: null, role: null, permissions: {}, navigationPermissions: getNavigationPermissions(null, {}) };
  let result = await supabase.from("user_permissions").select("role,permissions").eq("user_id", user.id).maybeSingle();
  let row = result.data as { role?: string; permissions?: PermissionValue } | null;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!row && serviceRole && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
    const adminResult = await admin.from("user_permissions").select("role,permissions").eq("user_id", user.id).maybeSingle();
    row = adminResult.data as { role?: string; permissions?: PermissionValue } | null;
    if (adminResult.error) result = adminResult;
  }
  const permissions = normalizePermissions(row?.permissions);
  const role = row?.role ?? null;
  return { user, role, permissions, navigationPermissions: getNavigationPermissions(role, permissions) };
}

export async function requirePermission(permission: AdminPermission) {
  const access = await getCurrentAccess();
  if (!access.user) redirect("/login");
  if (!hasPermission(access, permission)) redirect(`/unauthorized?permission=${permission}`);
  return access;
}
