import { requirePermission } from "@/lib/authorization";

export default async function LiveLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("live");
  return children;
}
