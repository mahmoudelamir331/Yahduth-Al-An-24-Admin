"use client";

import { BarChart3, ChevronDown, FileText, Home, LogOut, Megaphone, Menu, Radio, Settings, ShieldCheck, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminPermission } from "@/lib/authorization";
import { createClient } from "@/lib/supabase-browser";

type SidebarSection = { label: string; icon: typeof Home; permission: AdminPermission; href?: string; children?: { label: string; href: string }[] };
const sections: SidebarSection[] = [
  { label: "الرئيسية", icon: Home, href: "/", permission: "dashboard" },
  { label: "إدارة المحتوى", icon: FileText, permission: "content", children: [
    { label: "كل الأخبار", href: "/articles" },
    { label: "إضافة خبر", href: "/articles/new" },
    { label: "التصنيفات", href: "/categories" },
  ] },
  { label: "البث المباشر", icon: Radio, href: "/live", permission: "live" },
  { label: "الإعلانات", icon: Megaphone, href: "/ads", permission: "ads" },
  { label: "إعدادات الموقع", icon: Settings, href: "/settings", permission: "settings" },
  { label: "الفريق والصلاحيات", icon: ShieldCheck, href: "/team", permission: "team" },
  { label: "طلبات الباسورد", icon: ShieldCheck, href: "/password-requests", permission: "passwordRequests" },
  { label: "حسابي", icon: User, href: "/profile", permission: "profile" },
];

export function Sidebar({ permissions }: { permissions: Record<AdminPermission, boolean> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("الرئيسية");
  const [openGroup, setOpenGroup] = useState<string | null>("إدارة المحتوى");
  async function logout() { await createClient().auth.signOut(); router.push("/login"); router.refresh(); }
  const linkClass = (label: string) => `${active === label ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"} interactive-button flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold sm:px-4 sm:py-3 sm:text-sm`;
  function navigate(label: string) { setActive(label); setOpen(false); }
  return <>
    <button className="fixed right-4 top-4 z-30 grid size-10 place-items-center rounded-lg border bg-card lg:hidden" onClick={() => setOpen(!open)} aria-label="فتح القائمة">{open ? <X /> : <Menu />}</button>
    {open && <button className="fixed inset-0 z-20 bg-slate-950/40 lg:hidden" onClick={() => setOpen(false)} aria-label="إغلاق القائمة" />}
    <aside className={`${open ? "translate-x-0" : "translate-x-full"} fixed right-0 top-0 z-20 flex h-screen w-72 flex-col border-l bg-card p-5 transition-transform lg:static lg:z-0 lg:w-64 lg:translate-x-0`}>
      <div className="mb-10 flex items-center gap-3 px-2"><div className="grid size-11 place-items-center rounded-xl bg-primary text-xl font-black text-primary-foreground">ي</div><div><p className="font-bold">يحدث الآن</p><p className="text-xs text-muted-foreground">لوحة التحكم</p></div></div>
      <nav className="space-y-1.5 overflow-y-auto sm:space-y-2" aria-label="القائمة الرئيسية">{sections.filter(section => permissions[section.permission]).map(section => {
        const Icon = section.icon;
        if (section.href) {
          return <Link key={section.label} href={section.href} onClick={() => navigate(section.label)} className={linkClass(section.label)}><Icon size={18} />{section.label}{section.label === "البث المباشر" && <span className="mr-auto size-2 rounded-full bg-red-500" />}</Link>;
        }
        const expanded = openGroup === section.label;
        return <div key={section.label}><button type="button" onClick={() => setOpenGroup(expanded ? null : section.label)} aria-expanded={expanded} className={`${expanded ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"} interactive-button flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold sm:px-4 sm:py-3 sm:text-sm`}><Icon size={18} />{section.label}<ChevronDown size={15} className={`mr-auto transition-transform ${expanded ? "rotate-180" : ""}`} /></button>{expanded && <div className="mr-9 mt-1 space-y-1 border-r pr-3 text-xs text-muted-foreground">{(section.children ?? []).map(child => <Link key={child.href} href={child.href} onClick={() => navigate(child.label)} className="interactive-button block rounded px-1 py-1.5 hover:text-primary">{child.label}</Link>)}</div>}</div>;
      })}</nav>
      <div className="mt-auto space-y-3"><div className="rounded-xl bg-accent p-3 sm:rounded-2xl sm:p-4"><BarChart3 className="mb-2 text-primary sm:mb-3" size={21} /><p className="text-sm font-bold">أداء اليوم</p><p className="mt-1 text-xs text-muted-foreground">زيادة 18% عن أمس</p></div><button type="button" onClick={logout} className="interactive-button flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30 sm:text-sm" aria-label="تسجيل خروج"><LogOut size={17} />تسجيل خروج</button></div>
    </aside>
  </>;
}
