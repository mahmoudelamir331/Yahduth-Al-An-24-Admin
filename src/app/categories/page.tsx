"use client";

import { FolderPlus, Tags } from "lucide-react";
import { useEffect, useState } from "react";

type Category = { id: number; name: string; slug: string; is_active: boolean };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function fetchCategories() {
    const response = await fetch("/api/admin/categories", { cache: "no-store" });
    const result = (await response.json().catch(() => ({}))) as { categories?: Category[]; error?: string };
    if (!response.ok) throw new Error(result.error ?? "تعذر تحميل التصنيفات");
    return result.categories ?? [];
  }
  useEffect(() => {
    let active = true;
    fetchCategories()
      .then((loadedCategories) => { if (active) setCategories(loadedCategories); })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : "تعذر تحميل التصنيفات"); });
    return () => { active = false; };
  }, []);
  async function addCategory() {
    if (!name.trim()) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "تعذر إضافة التصنيف");
      setName("");
      setCategories(await fetchCategories());
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "تعذر إضافة التصنيف");
    } finally { setBusy(false); }
  }
  async function toggleActive(category: Category) {
    setError("");
    const response = await fetch("/api/admin/categories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: category.id, is_active: !category.is_active }) });
    const result = (await response.json().catch(() => ({}))) as { category?: Category; error?: string };
    if (!response.ok || !result.category) { setError(result.error ?? "تعذر تغيير حالة التصنيف"); return; }
    setCategories(current => current.map(item => item.id === category.id ? result.category! : item));
  }
  return <main className="min-h-screen flex-1 bg-background p-4 text-foreground sm:p-8"><div className="mx-auto max-w-4xl"><p className="text-sm font-semibold text-primary">إدارة المحتوى</p><h1 className="mt-1 mb-6 text-2xl font-black">التصنيفات</h1><section className="rounded-xl border bg-card p-5 shadow-sm"><div className="flex flex-wrap gap-2"><input value={name} onChange={event => setName(event.target.value)} placeholder="اسم التصنيف الجديد" className="admin-input flex-1" /><button disabled={busy} onClick={addCategory} className="interactive-button flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"><FolderPlus size={17} />إضافة</button></div>{error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}</section><section className="mt-5 rounded-xl border bg-card shadow-sm"><div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="p-4 font-semibold">التصنيف</th><th className="p-4 font-semibold">المعرف</th><th className="p-4 font-semibold">الحالة</th></tr></thead><tbody>{categories.length === 0 ? <tr><td colSpan={3} className="p-10 text-center text-muted-foreground"><Tags className="mx-auto mb-3" size={26} />مفيش تصنيفات لسه</td></tr> : categories.map(category => <tr key={category.id} className="border-t hover:bg-muted/40"><td className="p-4 font-semibold">{category.name}</td><td className="p-4 font-mono text-xs text-muted-foreground" dir="ltr">{category.slug}</td><td className="p-4"><button onClick={() => toggleActive(category)} className={`rounded-full px-3 py-1 text-xs font-bold ${category.is_active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{category.is_active ? "مفعل" : "متوقف"}</button></td></tr>)}</tbody></table></div></section></div></main>;
}
