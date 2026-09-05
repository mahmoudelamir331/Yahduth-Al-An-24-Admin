import type { ReactNode } from "react";
import AdminShell from "@/components/AdminShell";
import { requirePermission } from "@/lib/authorization";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requirePermission("passwordRequests");
  return <AdminShell title="طلبات كلمات المرور">{children}</AdminShell>;
}
