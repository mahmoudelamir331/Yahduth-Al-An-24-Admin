"use client";

import { ChevronDown, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";

const permissionGroups: { group: string; items: { key: string; label: string }[] }[] = [
  { group: "إدارة المحتوى", items: [{ key: "article.create", label: "إضافة خبر" }, { key: "article.edit", label: "تعديل الأخبار" }, { key: "article.delete", label: "حذف الأخبار" }, { key: "categories.manage", label: "إدارة التصنيفات" }] },
  { group: "البث المباشر", items: [{ key: "live.start", label: "بدء البث" }, { key: "live.edit", label: "تعديل البث" }, { key: "live.stop", label: "إيقاف البث" }] },
  { group: "الإعلانات", items: [{ key: "ads.create", label: "إضافة إعلان" }, { key: "ads.edit", label: "تعديل الإعلانات" }, { key: "ads.delete", label: "حذف الإعلانات" }] },
  { group: "إعدادات الموقع", items: [{ key: "settings.manage", label: "تعديل الإعدادات" }] },
  { group: "الفريق", items: [{ key: "team.add", label: "إضافة موظف" }, { key: "team.permissions", label: "تعديل الصلاحيات" }] },
];

type Member = { user_id: string; role: string; permissions: Record<string, boolean>; full_name?: string | null };

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [openGroup, setOpenGroup] = useState<string | null>("إدارة المحتوى");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<Record<string, boolean>>({});
  const [editRole, setEditRole] = useState("editor");

  async function load() {
    const response = await fetch("/api/team", { cache: "no-store" });
    const result = (await response.json()) as { members?: Member[]; error?: string };
    if (!response.ok) setError(result.error ?? "تعذر تحميل أعضاء الفريق");
    else setMembers(result.members ?? []);
  }

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function addMember() {
    setBusy(true); setError(""); setMessage("");
    const response = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, name, role, permissions: perms }) });
    const result = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) setError(result.error ?? "حدث خطأ");
    else { setMessage(result.message ?? "تم إنشاء الموظف"); setShowForm(false); setName(""); setEmail(""); setPerms({}); await load(); }
    setBusy(false);
  }

  async function removeMember(member: Member) {
    if (!confirm(`إزالة صلاحيات ${member.full_name ?? member.user_id.slice(0, 8)}؟`)) return;
    setBusy(true); setError(""); setMessage("");
    const response = await fetch("/api/team", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: member.user_id }) });
    const result = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) setError(result.error ?? "تعذر إزالة الموظف");
    else { setMessage(result.message ?? "تمت إزالة الموظف من الفريق"); await load(); }
    setBusy(false);
  }

  function startEdit(member: Member) {
    setEditingId(member.user_id);
    setEditPerms({ ...(member.permissions ?? {}) });
    setEditRole(member.role === "super_admin" ? "editor" : member.role);
    setError(""); setMessage("");
  }

  async function saveEdit() {
    if (!editingId) return;
    setBusy(true); setError(""); setMessage("");
    const response = await fetch("/api/team", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: editingId, role: editRole, permissions: editPerms }) });
    const result = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) setError(result.error ?? "تعذر تحديث الصلاحيات");
    else { setMessage(result.message ?? "تم تحديث الصلاحيات بنجاح"); setEditingId(null); await load(); }
    setBusy(false);
  }

  return <main className="min-h-screen flex-1 bg-background p-4 text-foreground sm:p-8"><div className="mx-auto max-w-5xl"><div className="mb-6 flex items-center justify-between"><div><p className="text-sm font-semibold text-primary">الإعدادات والأمان</p><h1 className="mt-1 text-2xl font-black">إدارة الفريق والصلاحيات</h1></div><button onClick={() => setShowForm(!showForm)} className="interactive-button flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><UserPlus size={17} />إضافة موظف</button></div>{message && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</p>}{error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
    {showForm && <section className="mb-6 rounded-xl border bg-card p-5 shadow-sm"><div className="mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-accent text-primary"><ShieldCheck size={21} /></span><div><h2 className="font-bold">بيانات الموظف الجديد</h2><p className="text-xs text-muted-foreground">هيتعمل حساب Auth بباسورد مؤقت وتحدد صلاحياته بالتفصيل</p></div></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">الاسم<input value={name} onChange={(event) => setName(event.target.value)} className="admin-input mt-1.5" placeholder="اسم الموظف" /></label><label className="text-sm font-semibold">البريد الإلكتروني<input type="email" dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} className="admin-input mt-1.5" placeholder="name@example.com" /></label><label className="text-sm font-semibold">الدور<select value={role} onChange={(event) => setRole(event.target.value)} className="admin-input mt-1.5"><option value="editor">محرر</option><option value="reviewer">مراجع</option></select></label></div><PermissionChecklist permissions={perms} onChange={setPerms} openGroup={openGroup} setOpenGroup={setOpenGroup} /><button disabled={busy} onClick={addMember} className="interactive-button mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">{busy ? "جاري الإنشاء..." : "إنشاء الحساب"}</button></section>}
    <section className="rounded-xl border bg-card shadow-sm">{members.length === 0 ? <p className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Users size={20} />مفيش موظفين لسه — ضيف أول موظف</p> : <ul className="divide-y">{members.map((member) => <li key={member.user_id} className="p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold">{member.full_name ?? "بدون اسم"}</p><p className="text-xs text-muted-foreground">{member.role === "super_admin" ? "مدير عام" : member.role === "reviewer" ? "مراجع" : "محرر"} • {Object.values(member.permissions ?? {}).filter(Boolean).length} صلاحية مفعلة</p></div>{member.role !== "super_admin" && <div className="flex items-center gap-2"><button onClick={() => (editingId === member.user_id ? setEditingId(null) : startEdit(member))} className="interactive-button rounded-lg border px-3 py-1.5 text-xs font-bold text-primary hover:bg-accent">{editingId === member.user_id ? "إلغاء" : "تعديل الصلاحيات"}</button><button disabled={busy} onClick={() => removeMember(member)} className="interactive-button rounded-lg border px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:hover:bg-rose-950/30">إزالة</button></div>}</div>{editingId === member.user_id && <div className="mt-4 rounded-lg border bg-muted/30 p-4"><div className="mb-4 flex flex-wrap items-center gap-3"><span className="text-sm font-bold">تعديل صلاحيات {member.full_name ?? "العضو"}</span><label className="text-xs font-semibold">الدور<select value={editRole} onChange={(event) => setEditRole(event.target.value)} className="admin-input py-1.5 text-xs"><option value="editor">محرر</option><option value="reviewer">مراجع</option></select></label></div><PermissionChecklist permissions={editPerms} onChange={setEditPerms} openGroup={openGroup} setOpenGroup={setOpenGroup} edit /><button disabled={busy} onClick={saveEdit} className="interactive-button mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60">{busy ? "جاري الحفظ..." : "حفظ التعديلات"}</button></div>}</li>)}</ul>}</section></div></main>;
}

function PermissionChecklist({ permissions, onChange, openGroup, setOpenGroup, edit = false }: { permissions: Record<string, boolean>; onChange: (value: Record<string, boolean> | ((current: Record<string, boolean>) => Record<string, boolean>)) => void; openGroup: string | null; setOpenGroup: (value: string | null) => void; edit?: boolean }) {
  const prefix = edit ? "edit-" : "";
  return <div className={edit ? "space-y-2" : "mt-6 border-t pt-5"}>{!edit && <h2 className="mb-4 font-bold">تفاصيل الصلاحيات</h2>}<div className="space-y-2">{permissionGroups.map((group) => { const groupKey = `${prefix}${group.group}`; const expanded = openGroup === groupKey; return <div key={groupKey} className="overflow-hidden rounded-lg border"><button type="button" onClick={() => setOpenGroup(expanded ? null : groupKey)} aria-expanded={expanded} className="flex w-full items-center justify-between bg-muted/40 px-4 py-3 text-sm font-bold"><span>{group.group}</span><ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} /></button>{expanded && <div className="grid gap-2 p-4 sm:grid-cols-2">{group.items.map((item) => <label key={item.key} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:border-primary"><input type="checkbox" checked={permissions[item.key] === true} onChange={() => onChange((current) => ({ ...current, [item.key]: !current[item.key] }))} />{item.label}</label>)}</div>}</div>; })}</div></div>;
}
