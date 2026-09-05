import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;

export type Permission = "content" | "live" | "ads" | "settings" | "team";
export const defaultPermissions: Record<Permission, boolean> = { content: true, live: true, ads: false, settings: false, team: false };
