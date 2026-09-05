import { NextResponse } from "next/server";
import { getCurrentAccess, hasPermission } from "@/lib/authorization";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const access = await getCurrentAccess();
  if (!access.user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!hasPermission(access, "dashboard")) return NextResponse.json({ error: "ليس لديك صلاحية عرض لوحة التحكم" }, { status: 403 });

  const supabase = await createClient();
  const [articlesResult, categoriesResult, staffResult, settingsResult] = await Promise.all([
    supabase.from("articles").select("id,title,status,published_at,views_count,categories(name)").order("published_at", { ascending: false }).limit(20),
    supabase.from("categories").select("name,slug").eq("is_active", true).order("name").limit(100),
    supabase.from("user_permissions").select("user_id", { count: "exact", head: true }),
    supabase.from("site_settings").select("live_streams").eq("id", true).maybeSingle(),
  ]);
  if (articlesResult.error) return NextResponse.json({ error: articlesResult.error.message }, { status: 500 });
  if (categoriesResult.error) return NextResponse.json({ error: categoriesResult.error.message }, { status: 500 });

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
    stats: { published: rows.filter((item) => item.status === "published").length, pending: rows.filter((item) => item.status !== "published").length, views: new Intl.NumberFormat("ar-EG", { notation: "compact" }).format(totalViews), live: live.length },
    staff: staffResult.count ?? 0,
    articles: mapped,
    categories: categoriesResult.data ?? [],
    live,
  });
}

export const dynamic = "force-dynamic";
