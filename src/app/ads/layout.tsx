import { requirePermission } from "@/lib/authorization";

export default async function AdsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("ads");
  return children;
}
