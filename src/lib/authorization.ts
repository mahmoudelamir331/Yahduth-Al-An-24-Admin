import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server";

export const adminPermissions = ["dashboard", "content", "live", "ads", "settings", "team", "profile", "passwordRequests"] as const;
export type AdminPermission = (typeof adminPermissions)[number];
type PermissionRecord = Record<string, boolean>;
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
  const result = await supabase.from("user_permissions").select("role,permissions").eq("user_id", user.id).maybeSingle();
  const row = result.data as { role?: string; permissions?: Record<string, boolean> } | null;
  const permissions = row?.permissions ?? {};
  const role = row?.role ?? null;
  return { user, role, permissions, navigationPermissions: getNavigationPermissions(role, permissions) };
}

export async function requirePermission(permission: AdminPermission) {
  const access = await getCurrentAccess();
  if (!access.user) redirect("/login");
  if (!hasPermission(access, permission)) redirect("/");
  return access;
}
