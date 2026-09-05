import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/authorization";
import { createClient } from "@/lib/supabase-server";
import { PasswordRequestsClient } from "./PasswordRequestsClient";

export const dynamic = "force-dynamic";

export default async function PasswordRequestsPage() {
  const access = await requirePermission("passwordRequests");
  if (access.role !== "super_admin") redirect("/");
  const supabase = await createClient();
  const result = await supabase.from("password_reset_requests").select("id,email,status,rejection_reason,created_at").order("created_at", { ascending: false }).limit(50);
  const requests = (result.data ?? []) as { id: string; email: string; status: string; rejection_reason: string | null; created_at: string }[];
  return <PasswordRequestsClient requests={requests} />;
}
