import { requirePermission } from "@/lib/authorization";

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("profile");
  return children;
}
