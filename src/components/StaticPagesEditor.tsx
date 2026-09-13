"use client";

import { Bold, Eye, EyeOff, Italic, List, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

type Page = { slug: string; title: string; content: string; seo_title: string | null; seo_description: string | null; is_visible: boolean; is_system: boolean; updated_at?: string };

export default function StaticPagesEditor() {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("about");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPage, setNewPage] = useState({ slug: "", title: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selected = useMemo(() => pages.find((page) => page.slug === selectedSlug) ?? null, [pages, selectedSlug]);
  const editor = useEditor({ extensions: [StarterKit, Placeholder.configure({ placeholder: "اكتب محتوى الصفحة هنا..." })], content: "", immediatelyRender: false });

  async function loadPages() {
    const response = await fetch("/api/admin/pages", { cache: "no-store" });
    const result = await response.json() as { pages?: Page[]; error?: string };
    if (!response.ok) throw new Error(result.error ?? "تعذر تحميل الصفحات");
    setPages(result.pages ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try { await loadPages(); }
      catch (reason) { if (!cancelled) setError(reason instanceof Error ? reason.message : "تعذر تحميل الصفحات"); }
      finally { if (!cancelled) setLoading(false); }
    }
    void init();
    return () => { cancelled = true; };
  }, []);

  // اسحب بيانات الصفحة القديمة من الداتا بيز فوراً عند فتح الصفحة للتعديل.
  useEffect(() => {
    if (editor && selected) editor.commands.setContent(selected.content || "");
  }, [editor, selected]);

  async function save() {
    if (!editor || !selected) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/pages", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: selected.slug, title: selected.title, content: editor.getHTML(), seo_title: selected.seo_title, seo_description: selected.seo_description, is_visible: selected.is_visible }) });
      const result = await response.json() as { page?: Page; error?: string };
      if (!response.ok || !result.page) throw new Error(result.error ?? "تعذر حفظ الصفحة");
      setPages((current) => current.map((page) => page.slug === selected.slug ? result.page! : page));
      setMessage("تم حفظ الصفحة بنجاح");
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "تعذر حفظ الصفحة"); }
    finally { setSaving(false); }
  }

  async function toggleVisible(page: Page) {
    setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/pages", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: page.slug, is_visible: !page.is_visible }) });
      const result = await response.json() as { page?: Page; error?: string };
      if (!response.ok || !result.page) throw new Error(result.error ?? "تعذر تغيير الظهور");
      setPages((current) => current.map((item) => item.slug === page.slug ? result.page! : item));
      setMessage(result.page.is_visible ? "الصفحة ظاهرة للزوار الآن" : "الصفحة مخفية عن الزوار الآن");
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "تعذر تغيير الظهور"); }
  }

  async function removePage(page: Page) {
    if (!confirm(`حذف صفحة "${page.title}" نهائياً؟`)) return;
    setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/pages", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: page.slug }) });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error ?? "تعذر حذف الصفحة");
      setPages((current) => current.filter((item) => item.slug !== page.slug));
      if (selectedSlug === page.slug) setSelectedSlug("about");
      setMessage("تم حذف الصفحة");
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "تعذر حذف الصفحة"); }
  }

  async function createPage() {
    setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/pages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newPage, slug: newPage.slug.trim().toLowerCase() }) });
      const result = await response.json() as { page?: Page; error?: string };
      if (!response.ok || !result.page) throw new Error(result.error ?? "تعذر إنشاء الصفحة");
      setPages((current) => [...current, result.page!]);
      setSelectedSlug(result.page.slug);
      setNewPage({ slug: "", title: "" });
      setCreating(false);
      setMessage("تم إنشاء الصفحة، اكتب محتواها واحفظ");
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "تعذر إنشاء الصفحة"); }
  }

  function patchSelected(patch: Partial<Page>) {
    setPages((current) => current.map((page) => page.slug === selectedSlug ? { ...page, ...patch } : page));
  }

  if (loading) return <section className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">جاري تحميل الصفحات...</section>;
  return <section className="space-y-4">
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{pages.map((page) => <div key={page.slug} className={`rounded-xl border p-4 transition ${selectedSlug === page.slug ? "border-primary bg-accent" : "bg-card hover:border-primary"} ${!page.is_visible ? "opacity-70" : ""}`}>
      <button type="button" onClick={() => { setSelectedSlug(page.slug); setMessage(""); }} className="w-full text-right">
        <span className="block font-bold">{page.title}</span>
        <span className="mt-1 block text-xs text-muted-foreground" dir="ltr">/{page.slug}</span>
      </button>
      <div className="mt-2 flex items-center gap-1">
        <button type="button" title={page.is_visible ? "إخفاء الصفحة" : "إظهار الصفحة"} onClick={() => void toggleVisible(page)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-primary">{page.is_visible ? <Eye size={15} /> : <EyeOff size={15} />}</button>
        {!page.is_system && <button type="button" title="حذف الصفحة" onClick={() => void removePage(page)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>}
        {!page.is_visible && <span className="mr-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">مخفية</span>}
      </div>
    </div>)}</div>

    {creating ? <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">صفحة جديدة</h3><button type="button" onClick={() => setCreating(false)} aria-label="إلغاء" className="rounded p-1 hover:bg-accent"><X size={16} /></button></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">عنوان الصفحة<input value={newPage.title} onChange={(event) => setNewPage((current) => ({ ...current, title: event.target.value }))} className="admin-input mt-1 w-full" placeholder="مثال: سياسة التحرير" /></label>
        <label className="text-sm font-semibold">المعرف (بالإنجليزية)<input value={newPage.slug} onChange={(event) => setNewPage((current) => ({ ...current, slug: event.target.value }))} dir="ltr" className="admin-input mt-1 w-full" placeholder="editorial-policy" /></label>
      </div>
      <button type="button" disabled={!newPage.title.trim() || !newPage.slug.trim()} onClick={() => void createPage()} className="interactive-button mt-3 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"><Plus size={15} />إنشاء الصفحة</button>
    </div> : <button type="button" onClick={() => setCreating(true)} className="interactive-button flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-bold"><Plus size={15} />إضافة صفحة جديدة</button>}

    {selected && <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm"><div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2"><button type="button" title="عريض" onClick={() => editor?.chain().focus().toggleBold().run()} className="toolbar-button"><Bold size={16} /></button><button type="button" title="مائل" onClick={() => editor?.chain().focus().toggleItalic().run()} className="toolbar-button"><Italic size={16} /></button><button type="button" title="قائمة" onClick={() => editor?.chain().focus().toggleBulletList().run()} className="toolbar-button"><List size={16} /></button><select aria-label="نمط العنوان" defaultValue="paragraph" onChange={(event) => { const value = event.target.value; if (value === "paragraph") editor?.chain().focus().setParagraph().run(); else editor?.chain().focus().toggleHeading({ level: Number(value) as 1 | 2 }).run(); }} className="h-8 rounded border bg-card px-2 text-xs"><option value="paragraph">نص عادي</option><option value="1">عنوان رئيسي</option><option value="2">عنوان فرعي</option></select></div><EditorContent editor={editor} className="prose prose-sm min-h-64 max-w-none p-5 outline-none" /></div>
      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 font-bold">إعدادات SEO</h3>
        <div className="grid gap-3">
          <label className="text-sm font-semibold">عنوان SEO (Title)<input value={selected.seo_title ?? ""} onChange={(event) => patchSelected({ seo_title: event.target.value })} className="admin-input mt-1 w-full" placeholder="يظهر في نتائج البحث" /></label>
          <label className="text-sm font-semibold">وصف SEO (Description)<textarea value={selected.seo_description ?? ""} onChange={(event) => patchSelected({ seo_description: event.target.value })} rows={3} className="admin-input mt-1 w-full" placeholder="وصف مختصر للصفحة يظهر في نتائج البحث" /></label>
        </div>
      </div>
      <label className="text-sm font-semibold">عنوان الصفحة<input value={selected.title} onChange={(event) => patchSelected({ title: event.target.value })} className="admin-input mt-1 w-full" /></label>
      <button type="button" disabled={saving || !editor} onClick={() => void save()} className="interactive-button flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"><Save size={17} />{saving ? "جاري الحفظ..." : "حفظ الصفحة"}</button>
    </div>}
  </section>
}
