"use client";

import { Activity, ArrowUpLeft, Eye, FileCheck2, FilePlus2, Radio, RefreshCw, Search, Settings2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

type DashboardData = { stats: { published: number; pending: number; views: string; live: number }; articles: { id: number; title: string; category: string; status: string; time: string }[]; live: { title: string; viewers: number }[] };
const statItems = [{ key: "published", label: "خبر منشور", icon: FileCheck2, tone: "text-emerald-600" }, { key: "pending", label: "في انتظار المراجعة", icon: Activity, tone: "text-amber-600" }, { key: "views", label: "إجمالي المشاهدات", icon: Eye, tone: "text-sky-600" }, { key: "live", label: "بث مباشر الآن", icon: Radio, tone: "text-rose-600" }];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [visibleStats, setVisibleStats] = useState<Record<string, boolean>>(() => { if (typeof window === "undefined") return { published: true, pending: true, views: true, live: true }; const stored = window.localStorage.getItem("dashboard-stats"); return stored ? JSON.parse(stored) as Record<string, boolean> : { published: true, pending: true, views: true, live: true }; });
  const [customizeOpen, setCustomizeOpen] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        const result = await response.json() as DashboardData & { error?: string };
        if (!response.ok) throw new Error(result.error || "تعذر تحميل بيانات اللوحة");
        if (!cancelled) { setData(result); setLoadError(null); }
      } catch (reason) {
        if (!cancelled) {
          setData(null);
          setLoadError(reason instanceof Error ? reason.message : "تعذر تحميل بيانات اللوحة");
        }
      }
    }
    void loadDashboard();
    return () => { cancelled = true; };
  }, []);
  const toggleStat = (key: string) => setVisibleStats(current => { const next = { ...current, [key]: !current[key] }; window.localStorage.setItem("dashboard-stats", JSON.stringify(next)); return next; });
  return <main className="min-h-screen flex-1 bg-background p-4 text-foreground sm:p-6 lg:p-8">
    <div className="mx-auto max-w-7xl animate-rise-in">
      <header className="mb-5 flex items-start justify-between gap-3 sm:mb-8 sm:gap-4"><div><p className="mb-1 text-xs font-semibold text-primary sm:mb-2 sm:text-sm">الخميس، 12 يونيو 2025</p><h1 className="text-xl font-black tracking-tight sm:text-3xl">صباح الخير، أحمد</h1><p className="mt-1 text-xs text-muted-foreground sm:mt-2 sm:text-sm">دي نظرة سريعة على أداء غرفة الأخبار النهارده.</p></div><div className="flex gap-1.5 sm:gap-2"><ThemeToggle /><button onClick={() => setCustomizeOpen(!customizeOpen)} className="interactive-button grid size-9 place-items-center rounded-lg border bg-card text-muted-foreground sm:size-10" aria-label="تخصيص اللوحة" title="تخصيص اللوحة"><Settings2 size={17} /></button><Link href="/articles/new" className="interactive-button flex h-9 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-bold text-primary-foreground sm:h-10 sm:gap-2 sm:px-3 sm:text-sm"><FilePlus2 size={16} />خبر جديد</Link></div></header>
      {customizeOpen && <div className="mb-4 flex-wrap items-center gap-3 rounded-xl border bg-card p-3 text-xs shadow-sm"><span className="font-bold">الكروت الظاهرة:</span>{statItems.map(({ key, label }) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={visibleStats[key]} onChange={() => toggleStat(key)} />{label}</label>)}</div>}
      <section className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">{statItems.filter(({ key }) => visibleStats[key]).map(({ key, label, icon: Icon, tone }) => <div key={key} className="interactive-card rounded-xl border bg-card p-3 shadow-sm sm:p-4"><div className="mb-3 flex items-center justify-between sm:mb-5"><span className={`grid size-8 place-items-center rounded-lg bg-muted ${tone} sm:size-9`}><Icon size={17} /></span><TrendingUp size={15} className="text-emerald-600" /></div><p className="text-xl font-black sm:text-2xl">{data?.stats[key as keyof DashboardData["stats"]] ?? "-"}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}</section>
      {loadError && <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"><span>{loadError}</span><button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-rose-700 px-3 py-2 text-xs font-bold text-white">إعادة المحاولة</button></div>}
      <section className="mt-5 grid gap-4 sm:mt-8 sm:gap-6 xl:grid-cols-[1fr_340px]"><div className="min-w-0 rounded-xl border bg-card shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-5"><div><h2 className="font-bold">أحدث الأخبار</h2><p className="mt-1 text-xs text-muted-foreground">آخر المحتوى المضاف لغرفة الأخبار</p></div><div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-muted-foreground"><Search size={16} /><input className="w-24 bg-transparent text-xs outline-none sm:w-40" placeholder="بحث..." aria-label="بحث في الأخبار" /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-right text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="p-4 font-semibold">العنوان</th><th className="p-4 font-semibold">التصنيف</th><th className="p-4 font-semibold">الحالة</th><th className="p-4 font-semibold">التوقيت</th><th className="p-4" /></tr></thead><tbody>{data?.articles.map(article => <tr key={article.id} className="interactive-row border-t hover:bg-muted/40"><td className="max-w-sm p-4 font-semibold">{article.title}</td><td className="p-4 text-muted-foreground">{article.category}</td><td className="p-4"><span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">{article.status}</span></td><td className="p-4 text-xs text-muted-foreground">{article.time}</td><td className="p-4"><button className="text-muted-foreground hover:text-primary" aria-label={`فتح ${article.title}`}><ArrowUpLeft size={17} /></button></td></tr>) ?? <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground"><RefreshCw className="mx-auto mb-2 animate-spin" size={18} />جاري تحميل البيانات</td></tr>}</tbody></table></div></div>
        <aside className="rounded-xl border bg-card p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">البث المباشر</h2><p className="mt-1 text-xs text-muted-foreground">المحتوى المباشر حالياً</p></div><span className="flex items-center gap-1 text-xs font-bold text-rose-600"><span className="size-2 animate-pulse rounded-full bg-rose-600" /> مباشر</span></div><div className="space-y-3">{data?.live.map(item => <div key={item.title} className="rounded-lg border bg-muted/30 p-3"><p className="text-sm font-bold">{item.title}</p><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Eye size={14} /> {item.viewers} مشاهد</p></div>)}</div></aside></section>
    </div></main>;
}
