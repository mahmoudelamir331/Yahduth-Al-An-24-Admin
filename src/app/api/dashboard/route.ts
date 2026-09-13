import { NextResponse } from "next/server";
import { getCurrentAccess, hasPermission } from "@/lib/authorization";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET() {
  const access = await getCurrentAccess();
  if (!access.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!hasPermission(access, "dashboard")) return NextResponse.json({ error: "ليس لديك صلاحية عرض لوحة التحكم" }, { status: 403 });

  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const [articlesResult, categoriesResult, staffResult, settingsResult, topTodayResult, monthCountResult, visitsResult, todayVisitsResult] = await Promise.all([
    supabase.from("articles").select("id,title,status,published_at,views_count,categories(name)").order("published_at", { ascending: false }).limit(20),
    supabase.from("categories").select("name,slug").eq("is_active", true).order("name").limit(100),
    supabase.from("user_permissions").select("user_id", { count: "exact", head: true }),
    supabase.from("site_settings").select("live_streams").eq("id", true).maybeSingle(),
    supabase.from("article_view_events").select("article_id", { count: "exact", head: true }).eq("viewed_on", today),
    supabase.from("articles").select("id", { count: "exact", head: true }).gte("published_at", monthStart),
    supabase.from("site_visits").select("visitor_hash", { count: "exact", head: true }),
    supabase.from("site_visits").select("visitor_hash", { count: "exact", head: true }).eq("visited_on", today),
  ]);
  if (articlesResult.error) return NextResponse.json({ error: articlesResult.error.message }, { status: 500 });
  if (categoriesResult.error) return NextResponse.json({ error: categoriesResult.error.message }, { status: 500 });

  // أكثر خبر مشاهدة اليوم: نسجّل عدد مشاهدات كل خبر النهاردة من جدول الأحداث.
  const viewsToday = topTodayResult.count ?? 0;
  let topArticleToday: { id: string; title: string; views_today: number } | null = null;
  if (viewsToday > 0) {
    const events = await supabase.from("article_view_events").select("article_id").eq("viewed_on", today).limit(2000);
    if (!events.error) {
      const counts = new Map<string, number>();
      for (const event of events.data ?? []) counts.set(event.article_id, (counts.get(event.article_id) ?? 0) + 1);
      let topId: string | null = null; let topCount = 0;
      for (const [id, count] of counts) if (count > topCount) { topId = id; topCount = count; }
      if (topId) {
        const articleRow = await supabase.from("articles").select("id,title").eq("id", topId).maybeSingle();
        topArticleToday = { id: topId, title: articleRow.data?.title ?? "", views_today: topCount };
      }
    }
  }

  const rows = articlesResult.data ?? [];
  const mapped = rows.map((item) => {
    const category = item.categories as unknown as { name?: string } | { name?: string }[] | null;
    const statusLabels: Record<string, string> = { published: "منشور", draft: "مسودة", review: "مراجعة", pending: "مراجعة" };
    return {
      id: String(item.id), title: item.title, category: Array.isArray(category) ? category[0]?.name ?? "غير مصنف" : category?.name ?? "غير مصنف",
      status: statusLabels[item.status] ?? String(item.status), rawStatus: item.status,
      time: item.published_at ? new Date(item.published_at).toLocaleDateString("ar-EG") : "مسودة",
    };
  });
  const liveSettings = settingsResult.data?.live_streams as { enabled?: boolean; url?: string; title?: string } | null;
  const live = liveSettings?.enabled ? [{ title: liveSettings.title || "البث المباشر", viewers: 0 }] : [];
  const totalViews = rows.reduce((sum, item) => sum + Number(item.views_count ?? 0), 0);
  return NextResponse.json({
    stats: { published: rows.filter((item) => item.status === "published").length, pending: rows.filter((item) => item.status !== "published").length, views: new Intl.NumberFormat("ar-EG", { notation: "compact" }).format(totalViews), live: live.length, categories: categoriesResult.data?.length ?? 0, staff: staffResult.count ?? 0 },
    staff: staffResult.count ?? 0,
    articles: mapped,
    categories: categoriesResult.data ?? [],
    live,
    newsroom: {
      top_article_today: topArticleToday,
      views_today: viewsToday,
      total_visits: visitsResult.count ?? 0,
      visits_today: todayVisitsResult.count ?? 0,
      published_this_month: monthCountResult.count ?? 0,
    },
  });
}

export const dynamic = "force-dynamic";
