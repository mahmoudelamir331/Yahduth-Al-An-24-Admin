"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Edit3, Eye, EyeOff, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

type Category = { id: string; name: string; slug: string; is_active: boolean };

export default function CategoriesManager() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [notice, setNotice] = useState("");

  async function load() {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) return;
    const response = await fetch("/api/admin/categories", { headers: { Authorization: `Bearer ${session.access_token}` } });
    if (response.ok) setCategories((await response.json()).categories ?? []);
  }
  useEffect(() => { void load(); }, []);

  async function request(method: string, body?: Record<string, unknown>, id?: string) {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) return false;
    const response = await fetch(id ? `/api/admin/categories?id=${encodeURIComponent(id)}` : "/api/admin/categories", { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: body ? JSON.stringify(body) : undefined });
    const result = await response.json().catch(() => ({}));
    setNotice(result.message ?? (response.ok ? "تم الحفظ." : "تعذر تنفيذ العملية."));
    if (response.ok) await load();
    return response.ok;
  }
  async function add(event: FormEvent) { event.preventDefault(); if (await request("POST", { name, slug })) { setName(""); setSlug(""); } }
  async function saveEdit(event: FormEvent) { event.preventDefault(); if (editing && await request("PATCH", { id: editing.id, name: editing.name, slug: editing.slug })) setEditing(null); }

  return <section className="space-y-6">
    <div><p className="text-primary font-bold text-sm">تنظيم المحتوى</p><h1 className="text-3xl font-bold">إدارة الأقسام</h1><p className="text-sm opacity-70 mt-2">أضف أقسام الموقع وتحكم في ظهورها بدون حذف الأخبار التابعة لها.</p></div>
    <form onSubmit={add} className="glass-card p-5 flex flex-col md:flex-row gap-3"><input required value={name} onChange={(e) => setName(e.target.value)} className="glass-input h-11 flex-1" placeholder="اسم القسم مثل رياضة" /><input value={slug} onChange={(e) => setSlug(e.target.value)} className="glass-input h-11 flex-1 font-mono" placeholder="slug اختياري" dir="ltr" /><button className="glass-button glass-button-primary h-11" type="submit"><Plus size={17} /> إضافة قسم</button></form>
    {notice && <p className="rounded-xl bg-primary/10 p-3 text-sm font-semibold text-primary">{notice}</p>}
    <div className="glass-card overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-glass-border/40 text-right"><th className="p-4">القسم</th><th className="p-4">الرابط</th><th className="p-4">الحالة</th><th className="p-4">إجراءات</th></tr></thead><tbody className="divide-y divide-glass-border/20">{categories.map((category) => <tr key={category.id}><td className="p-4 font-bold">{category.name}</td><td className="p-4 font-mono opacity-70">{category.slug}</td><td className="p-4"><button type="button" onClick={() => void request("PATCH", { id: category.id, isActive: !category.is_active })} className={category.is_active ? "text-emerald-600" : "text-slate-500"}>{category.is_active ? <><Eye size={16} className="inline ml-1" /> ظاهر</> : <><EyeOff size={16} className="inline ml-1" /> مخفي</>}</button></td><td className="p-4 flex gap-2"><button type="button" onClick={() => setEditing(category)} className="rounded-lg p-2 text-primary hover:bg-primary/10" aria-label="تعديل"><Edit3 size={16} /></button><button type="button" onClick={() => { if (window.confirm("حذف القسم؟ الأخبار لن تُحذف.")) void request("DELETE", undefined, category.id); }} className="rounded-lg p-2 text-urgent hover:bg-urgent/10" aria-label="حذف"><Trash2 size={16} /></button></td></tr>)}</tbody></table>{!categories.length && <p className="p-10 text-center opacity-60">لا توجد أقسام.</p>}</div>
    {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={saveEdit} className="glass-card w-full max-w-md space-y-4 p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">تعديل القسم</h2><button type="button" onClick={() => setEditing(null)}><X /></button></div><input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="glass-input h-11 w-full" /><input required value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="glass-input h-11 w-full font-mono" dir="ltr" /><button className="glass-button glass-button-primary h-11 w-full" type="submit"><Check size={17} /> حفظ</button></form></div>}
  </section>;
}
