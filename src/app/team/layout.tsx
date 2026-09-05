import { requirePermission } from "@/lib/authorization";

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("team");
  return children;
}
