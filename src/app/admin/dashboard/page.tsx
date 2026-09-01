"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, FileText, Image, LayoutDashboard, LogOut, Menu, Megaphone, MonitorCog, Moon, Newspaper, Settings2, ShieldCheck, Sun, Users, X, RadioTower, UserRound } from "lucide-react";
import { createClient, hasSupabaseConfig } from "@/lib/supabase-browser";
import NewsStudio from "@/components/NewsStudio";
import MediaManager from "@/components/MediaManager";
import LiveStreamManager from "@/components/LiveStreamManager";
import AdsManager from "@/components/AdsManager";
import TeamManager from "@/components/TeamManager";
import SystemManager from "@/components/SystemManager";
import JournalistManager from "@/components/JournalistManager";
import AccountManager from "@/components/AccountManager";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type Profile = { id: string; full_name: string; role: string; is_active: boolean };
type Permission = { key: string; label: string; description: string };
type StaffMember = Profile & { user_permissions: { permission_key: string }[] };

const roleLabels: Record<string, string> = { super_admin: "المالك", manager: "مدير", editor: "محرر", advertiser: "مسؤول إعلانات" };
const sections = [
  { id: "dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { id: "account", label: "حسابي", icon: UserRound },
  { id: "news", label: "الأخبار", icon: Newspaper, permission: "news.view" },
  { id: "analytics", label: "الإحصائيات", icon: BarChart3, permission: "system.manage" },
  { id: "media", label: "الميديا", icon: Image, permission: "media.manage" },
  { id: "live", label: "البث المباشر", icon: RadioTower, permission: "media.manage" },
  { id: "ads", label: "الإعلانات", icon: Megaphone, permission: "ads.manage" },
  { id: "journalists", label: "إدارة الصحفيين", icon: RadioTower, permission: "journalists.manage" },
  { id: "team", label: "إدارة الفريق", icon: Users, permission: "users.manage" },
  { id: "system", label: "الإعدادات", icon: MonitorCog, permission: "settings.maintenance" },
];

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [stats, setStats] = useState({ articles: 0, views: 0, staff: 0 });
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [catalog, setCatalog] = useState<Permission[]>([]);
  const [active, setActive] = useState("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const { theme, setTheme } = useTheme();

  const isOwner = profile?.role === "super_admin";
  const can = (key?: string) => isOwner || !key || permissions.includes(key);

  async function loadDashboard() {
    if (!hasSupabaseConfig()) {
      setLoading(false);
      return;
    }
    const userResponse = await supabase.auth.getUser();
    const user = userResponse.data.user;
    if (!user) {
      setLoading(false);
      router.replace("/admin");
      return;
    }
    const [{ data: currentProfile }, { data: ownPermissions }, articleCount, views, staffCount] = await Promise.all([
      supabase.from("profiles").select("id, full_name, role, is_active").eq("id", user.id).single(),
      supabase.from("user_permissions").select("permission_key").eq("user_id", user.id),
      supabase.from("articles").select("id", { count: "exact", head: true }),
      supabase.from("articles").select("views_count"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);
    if (!currentProfile?.is_active) { await supabase.auth.signOut(); router.replace("/admin"); return; }
    setProfile(currentProfile);
    setEmail(user.email ?? "");
    setPermissions((ownPermissions ?? []).map((item) => item.permission_key));
    setStats({ articles: articleCount.count ?? 0, views: (views.data ?? []).reduce((total, article) => total + article.views_count, 0), staff: staffCount.count ?? 0 });
    if (currentProfile.role === "super_admin") {
      const [{ data: allStaff }, { data: allPermissions }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, role, is_active, user_permissions(permission_key)").order("created_at", { ascending: false }),
        supabase.from("permissions").select("key, label, description").order("key"),
      ]);
      setStaff((allStaff ?? []) as StaffMember[]);
      setCatalog(allPermissions ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { void loadDashboard(); }, []);

  async function logout() { await supabase.auth.signOut(); router.replace("/admin"); }

  async function addStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const selectedPermissions = catalog.filter((item) => form.get(item.key) === "on").map((item) => item.key);
    setNotice("جارٍ إنشاء الحساب...");
    const sessionResponse = await supabase.auth.getSession();
    const session = sessionResponse.data.session;
    const response = await fetch("/api/admin/staff", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` }, body: JSON.stringify({ fullName: form.get("fullName"), email: form.get("email"), password: form.get("password"), role: form.get("role"), permissions: selectedPermissions }) });
    const result = await response.json();
    setNotice(result.message);
    if (response.ok) { event.currentTarget.reset(); await loadDashboard(); }
  }

  if (loading) return <main className="min-h-screen grid items-center justify-center font-bold text-lg text-primary">جارٍ تحميل لوحة التحكم...</main>;
  if (!profile && !hasSupabaseConfig()) return (
    <main className="min-h-screen grid place-items-center p-6 bg-slate-50 dark:bg-slate-900" dir="rtl">
      <div className="max-w-lg rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
        <h1 className="mb-3 text-xl font-bold">إعدادات الخادم ناقصة</h1>
        <p className="text-sm leading-7">أضف NEXT_PUBLIC_SUPABASE_URL وNEXT_PUBLIC_SUPABASE_ANON_KEY في Vercel، وبعدها اعمل Redeploy للوحة الأدمن.</p>
      </div>
    </main>
  );
  if (!profile) return null;
  const visibleSections = sections.filter((section) => can(section.permission));

  return (
    <main className="min-h-screen flex text-foreground relative z-0">
      <aside className={cn(
        "fixed md:relative z-20 w-[280px] h-screen glass-panel flex flex-col px-4 py-8 rounded-none border-t-0 border-b-0 transition-transform duration-300 shadow-xl",
        isMenuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center gap-3 px-3 mb-12">
          <div className="bg-primary/20 p-2 rounded-xl text-primary">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-tight">يحدث الآن</h1>
            <span className="text-xs opacity-70">لوحة التحكم</span>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-grow" aria-label="أقسام لوحة التحكم">
          {visibleSections.map((section) => {
            const Icon = section.icon;
            const isActive = active === section.id;
            return (
              <button 
                key={section.id} 
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm",
                  isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "hover:bg-white/20 dark:hover:bg-black/20"
                )} 
                onClick={() => { setActive(section.id); setIsMenuOpen(false); }}>
                <Icon size={20} className={isActive ? "opacity-100" : "opacity-70"} />
                {section.label}
              </button>
            ); 
          })}
        </nav>

        <div className="mt-auto px-4 py-3 border-t border-glass-border/30">
          <p className="text-xs opacity-70">{roleLabels[profile.role] ?? profile.role}</p>
          <p className="font-bold">{profile.full_name}</p>
        </div>
      </aside>

      {isMenuOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10 md:hidden" aria-label="إغلاق القائمة" onClick={() => setIsMenuOpen(false)} />}
      
      <section className="flex-1 w-full min-w-0 flex flex-col h-screen overflow-hidden">
        <header className="h-[80px] shrink-0 glass-panel rounded-none border-x-0 border-t-0 flex items-center justify-between px-6 z-10 w-full relative">
          <button className="md:hidden p-2 glass-button-secondary" aria-label="فتح القائمة" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="mr-auto flex items-center gap-4">
            <button className="glass-button-secondary !p-2 !rounded-full" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="hidden sm:flex flex-col text-left mr-4">
              <strong className="text-sm">{profile.full_name}</strong>
              <span className="text-xs opacity-70 block ml-auto">{roleLabels[profile.role] ?? profile.role}</span>
            </div>
            <button className="glass-button-secondary text-danger hover:text-danger hover:bg-danger/10" onClick={logout}>
              <LogOut size={16} /> <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 relative z-0">
          <div className="max-w-[1400px] mx-auto pb-20">
              {active === "dashboard" && <DashboardHome stats={stats} name={profile.full_name} />}
            {active === "account" && <AccountManager profile={profile} email={email} />}
            {active === "news" && <NewsStudio canPublish={isOwner || permissions.includes("news.publish")} canReview={isOwner || permissions.includes("news.review")} />}
            {active === "analytics" && <DashboardHome stats={stats} name={profile.full_name} />}
            {active === "media" && <MediaManager />}
            {active === "live" && <LiveStreamManager />}
            {active === "ads" && <AdsManager />}
            {active === "journalists" && (isOwner || permissions.includes("journalists.manage")) && <JournalistManager />}
            {active === "team" && isOwner && <TeamManager staff={staff} permissions={catalog} notice={notice} currentUserId={profile.id} onSubmit={addStaff} onReload={loadDashboard} />}
            {active === "system" && (isOwner || permissions.includes("settings.maintenance") || permissions.includes("settings.manage") || permissions.includes("system.manage")) && <SystemManager />}
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardHome({ stats, name }: { stats: { articles: number; views: number; staff: number }; name: string }) { 
  const cards = [{ label: "إجمالي الأخبار", value: stats.articles, icon: FileText, color: "text-teal-500 bg-teal-500/10" }, { label: "إجمالي الزيارات", value: new Intl.NumberFormat("ar-EG").format(stats.views), icon: BarChart3, color: "text-amber-500 bg-amber-500/10" }, { label: "أعضاء الفريق", value: stats.staff, icon: Users, color: "text-blue-500 bg-blue-500/10" }]; 
  return (
    <>
      <div className="mb-8">
        <p className="text-primary font-bold text-sm mb-1">أهلاً بيك يا {name}</p>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-foreground to-foreground/60 block">نظرة عامة</h1>
        <span className="text-sm opacity-70 mt-2 block">ملخص سريع لأهم أرقام المنصة اليوم</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {cards.map(({ label, value, icon: Icon, color }, index) => (
          <article className="glass-card flex items-center p-6 gap-6" style={{ animation: `fadeIn 0.5s ease-out ${index * 0.1}s both` }} key={label}>
            <div className={cn("p-4 rounded-2xl", color)}>
              <Icon size={28} />
            </div>
            <div>
              <span className="text-sm opacity-70 block mb-1">{label}</span>
              <strong className="text-3xl font-bold text-foreground block">{value}</strong>
            </div>
          </article>
        ))}
      </div>
    </>
  ); 
}
