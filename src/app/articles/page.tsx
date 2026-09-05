import { requirePermission } from "@/lib/authorization";
import { createClient } from "@/lib/supabase-server";
import Link from "next/link";

export const dynamic = "force-dynamic";
const statusLabels: Record<string, string> = { published: "منشور", draft: "مسودة", review: "مراجعة", pending: "مراجعة" };

export default async function ArticlesPage() {
  await requirePermission("content");
  const supabase = await createClient();
  const result = await supabase.from("articles").select("id,title,status,published_at").order("created_at", { ascending: false }).limit(50);
  const articles = (result.data ?? []) as { id: number; title: string; status: string; published_at: string | null; categories: unknown }[];
  return <main className="min-h-screen flex-1 bg-background p-4 text-foreground sm:p-8"><div className="mx-auto max-w-6xl"><div className="mb-6 flex items-center justify-between"><div><p className="text-sm font-semibold text-primary">إدارة المحتوى</p><h1 className="mt-1 text-2xl font-black">كل الأخبار</h1></div><Link href="/articles/new" className="interactive-button flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><span aria-hidden="true">+</span>إضافة خبر</Link></div><section className="rounded-xl border bg-card shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-right text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="p-4 font-semibold">العنوان</th><th className="p-4 font-semibold">التصنيف</th><th className="p-4 font-semibold">الحالة</th><th className="p-4 font-semibold">التاريخ</th></tr></thead><tbody>{articles.length === 0 ? <tr><td colSpan={4} className="p-10 text-center text-muted-foreground"><span aria-hidden="true" className="mb-3 block text-2xl">📰</span>مفيش أخبار لسه — ابدأ بإضافة أول خبر</td></tr> : articles.map(article => <tr key={article.id} className="border-t hover:bg-muted/40"><td className="max-w-sm p-4 font-semibold">{article.title}</td><td className="p-4 text-muted-foreground">غير مصنف</td><td className="p-4"><span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">{statusLabels[article.status] ?? article.status}</span></td><td className="p-4 text-xs text-muted-foreground">{article.published_at ? new Date(article.published_at).toLocaleDateString("ar-EG") : "—"}</td></tr>)}</tbody></table></div></section></div></main>;
}
