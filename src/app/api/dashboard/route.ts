import { NextResponse } from "next/server";
import { getCurrentAccess, hasPermission } from "@/lib/authorization";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const access = await getCurrentAccess();
  if (!access.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!hasPermission(access, "dashboard")) return NextResponse.json({ error: "ليس لديك صلاحية عرض لوحة التحكم" }, { status: 403 });

  const supabase = await createClient();
  const [articlesResult, categoriesResult] = await Promise.all([
    supabase.from("articles").select("id,title,status,published_at,categories(name)").order("published_at", { ascending: false }).limit(20),
    supabase.from("categories").select("name,slug").eq("is_active", true).order("name"),
  ]);
  if (articlesResult.error) return NextResponse.json({ error: articlesResult.error.message }, { status: 500 });
  if (categoriesResult.error) return NextResponse.json({ error: categoriesResult.error.message }, { status: 500 });

  const mapped = (articlesResult.data ?? []).map((item, index) => {
    const category = item.categories as unknown as { name?: string } | { name?: string }[] | null;
    const statusLabels: Record<string, string> = { published: "منشور", draft: "مسودة", review: "مراجعة", pending: "مراجعة" };
    return {
      id: index + 1,
      title: item.title,
      category: Array.isArray(category) ? category[0]?.name ?? "غير مصنف" : category?.name ?? "غير مصنف",
      status: statusLabels[item.status] ?? String(item.status),
      rawStatus: item.status,
      time: item.published_at ? new Date(item.published_at).toLocaleDateString("ar-EG") : "مسودة",
    };
  });
  const live = [{ title: "نشرة الأخبار المسائية", viewers: 842 }, { title: "حوار اليوم", viewers: 316 }];
  return NextResponse.json({
    stats: {
      published: mapped.filter((item) => item.rawStatus === "published").length,
      pending: mapped.filter((item) => item.rawStatus !== "published").length,
      views: "—",
      live: live.length,
    },
    articles: mapped,
    categories: categoriesResult.data ?? [],
    live,
  });
}

export const dynamic = "force-dynamic";
