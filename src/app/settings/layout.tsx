import type { ReactNode } from "react";
import AdminShell from "@/components/AdminShell";
import { requirePermission } from "@/lib/authorization";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requirePermission("settings");
  return <AdminShell title="إعدادات الموقع">{children}</AdminShell>;
}
