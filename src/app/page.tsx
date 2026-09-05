import Dashboard from "@/components/Dashboard";
import AdminShell from "@/components/AdminShell";
import { requirePermission } from "@/lib/authorization";

export default async function Home() {
  await requirePermission("dashboard");
  return <AdminShell><Dashboard /></AdminShell>;
}
