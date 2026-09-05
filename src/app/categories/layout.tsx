import { requirePermission } from "@/lib/authorization";

export default async function CategoriesLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("content");
  return children;
}
