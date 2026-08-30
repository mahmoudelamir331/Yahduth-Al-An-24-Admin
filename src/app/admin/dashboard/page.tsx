"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, FileText, LayoutDashboard, LogOut, Menu, ShieldCheck, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

type Profile = { id: string; full_name: string; role: string; is_active: boolean };
type Permission = { key: string; label: string; description: string };
type StaffMember = Profile & { user_permissions: { permission_key: string }[] };

const roleLabels: Record<string, string> = { super_admin: "المالك", manager: "مدير", editor: "محرر", advertiser: "مسؤول إعلانات" };
const sections = [
  { id: "dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { id: "news", label: "الأخبار", icon: FileText, permission: "news.view" },
  { id: "analytics", label: "الإحصائيات", icon: BarChart3, permission: "system.manage" },
  { id: "team", label: "إدارة الفريق", icon: Users, permission: "users.manage" },
];

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [stats, setStats] = useState({ articles: 0, views: 0, staff: 0 });
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [catalog, setCatalog] = useState<Permission[]>([]);
  const [active, setActive] = useState("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const isOwner = profile?.role === "super_admin";
  const can = (key?: string) => isOwner || !key || permissions.includes(key);

  async function loadDashboard() {
    const userResponse = await supabase.auth.getUser();
    const user = userResponse.data.user;
    if (!user) { router.replace("/admin"); return; }
    const [{ data: currentProfile }, { data: ownPermissions }, articleCount, views, staffCount] = await Promise.all([
      supabase.from("profiles").select("id, full_name, role, is_active").eq("id", user.id).single(),
      supabase.from("user_permissions").select("permission_key").eq("user_id", user.id),
      supabase.from("articles").select("id", { count: "exact", head: true }),
      supabase.from("articles").select("views_count"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);
    if (!currentProfile?.is_active) { await supabase.auth.signOut(); router.replace("/admin"); return; }
    setProfile(currentProfile);
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

  // Initial load is asynchronous and owns all dashboard state updates.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
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

  if (loading) return <main className="dashboard-loading">جارٍ تحميل لوحة التحكم...</main>;
  if (!profile) return null;
  const visibleSections = sections.filter((section) => can(section.permission));

  return <main className="admin-shell">
    <aside className={`admin-sidebar ${isMenuOpen ? "open" : ""}`}>
      <div className="sidebar-brand"><ShieldCheck size={25} /><span>يحدث الآن</span><small>لوحة التحكم</small></div>
      <nav aria-label="أقسام لوحة التحكم">{visibleSections.map((section) => { const Icon = section.icon; return <button key={section.id} className={active === section.id ? "nav-item active" : "nav-item"} onClick={() => { setActive(section.id); setIsMenuOpen(false); }}><Icon size={19} />{section.label}</button>; })}</nav>
      <div className="sidebar-footer"><span>{roleLabels[profile.role] ?? profile.role}</span><strong>{profile.full_name}</strong></div>
    </aside>
    {isMenuOpen && <button className="sidebar-overlay" aria-label="إغلاق القائمة" onClick={() => setIsMenuOpen(false)} />}
    <section className="admin-content">
      <header className="admin-header"><button className="header-icon" aria-label="فتح القائمة" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X /> : <Menu />}</button><div className="header-user"><div><strong>{profile.full_name}</strong><span>{roleLabels[profile.role] ?? profile.role}</span></div><button className="logout-button" onClick={logout}><LogOut size={17} />تسجيل الخروج</button></div></header>
      <div className="admin-main">
        {active === "dashboard" && <DashboardHome stats={stats} name={profile.full_name} />}
        {active === "news" && <EmptySection title="الأخبار" text="قسم الأخبار جاهز للمرحلة التالية." />}
        {active === "analytics" && <EmptySection title="الإحصائيات" text="تفاصيل التحليلات هتضاف في المرحلة التالية." />}
        {active === "team" && isOwner && <TeamManager staff={staff} permissions={catalog} notice={notice} onSubmit={addStaff} />}
      </div>
    </section>
  </main>;
}

function DashboardHome({ stats, name }: { stats: { articles: number; views: number; staff: number }; name: string }) { const cards = [{ label: "إجمالي الأخبار", value: stats.articles, icon: FileText, color: "teal" }, { label: "إجمالي الزيارات", value: new Intl.NumberFormat("ar-EG").format(stats.views), icon: BarChart3, color: "amber" }, { label: "أعضاء الفريق", value: stats.staff, icon: Users, color: "blue" }]; return <><div className="page-intro"><p>أهلاً بيك يا {name}</p><h1>نظرة عامة</h1></div><div className="stat-grid">{cards.map(({ label, value, icon: Icon, color }) => <article className="stat-card" key={label}><div className={`stat-icon ${color}`}><Icon size={23} /></div><span>{label}</span><strong>{value}</strong></article>)}</div></>; }
function EmptySection({ title, text }: { title: string; text: string }) { return <div className="page-intro"><p>لوحة التحكم</p><h1>{title}</h1><div className="empty-state">{text}</div></div>; }
function TeamManager({ staff, permissions, notice, onSubmit }: { staff: StaffMember[]; permissions: Permission[]; notice: string; onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> }) { return <><div className="page-intro"><p>المالك فقط</p><h1>إدارة الفريق</h1></div><div className="team-layout"><section className="team-form"><h2>إضافة موظف</h2><form onSubmit={onSubmit}><label>الاسم بالكامل<input name="fullName" required /></label><label>البريد الإلكتروني<input name="email" type="email" required /></label><label>كلمة المرور<input name="password" type="password" minLength={8} required /></label><label>الدور<select name="role" defaultValue="editor"><option value="manager">مدير</option><option value="editor">محرر</option><option value="advertiser">مسؤول إعلانات</option></select></label><fieldset><legend>الصلاحيات</legend>{permissions.map((permission) => <label className="permission-check" key={permission.key}><input name={permission.key} type="checkbox" /> <span><strong>{permission.label}</strong><small>{permission.description}</small></span></label>)}</fieldset><button className="primary-button" type="submit">إضافة الموظف</button>{notice && <p className="form-notice" role="status">{notice}</p>}</form></section><section className="staff-list"><h2>الفريق الحالي</h2>{staff.map((member) => <article key={member.id} className="staff-row"><div><strong>{member.full_name}</strong><span>{roleLabels[member.role] ?? member.role}</span></div><small>{member.role === "super_admin" ? "حساب المالك محمي" : `${member.user_permissions.length} صلاحيات`}</small></article>)}</section></div></>; }
