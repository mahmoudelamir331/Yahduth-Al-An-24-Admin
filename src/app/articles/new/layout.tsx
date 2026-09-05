import { requirePermission } from "@/lib/authorization";

export default async function NewArticleLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("content");
  return children;
}
