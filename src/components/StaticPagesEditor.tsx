"use client";

import { Bold, Italic, List, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

type Page = { slug: string; title: string; content: string; updated_at?: string };
const pageLabels: Record<string, string> = { about: "من نحن", contact: "تواصل معنا", privacy: "سياسة الخصوصية", terms: "الشروط والأحكام" };

export default function StaticPagesEditor() {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("about");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selected = useMemo(() => pages.find((page) => page.slug === selectedSlug) ?? null, [pages, selectedSlug]);
  const editor = useEditor({ extensions: [StarterKit, Placeholder.configure({ placeholder: "اكتب محتوى الصفحة هنا..." })], content: "", immediatelyRender: false });

  useEffect(() => {
    fetch("/api/admin/pages", { cache: "no-store" }).then(async (response) => {
      const result = await response.json() as { pages?: Page[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "تعذر تحميل الصفحات");
      setPages(result.pages ?? []);
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "تعذر تحميل الصفحات")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (editor && selected) editor.commands.setContent(selected.content || "");
  }, [editor, selected]);

  async function save() {
    if (!editor || !selected) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/pages", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: selected.slug, title: selected.title, content: editor.getHTML() }) });
      const result = await response.json() as { page?: Page; error?: string };
      if (!response.ok || !result.page) throw new Error(result.error ?? "تعذر حفظ الصفحة");
      setPages((current) => current.map((page) => page.slug === selected.slug ? result.page! : page));
      setMessage("تم حفظ محتوى الصفحة بنجاح");
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "تعذر حفظ الصفحة"); }
    finally { setSaving(false); }
  }

  if (loading) return <section className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">جاري تحميل الصفحات...</section>;
  return <section className="space-y-4">
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{pages.map((page) => <button key={page.slug} type="button" onClick={() => { setSelectedSlug(page.slug); setMessage(""); }} className={`rounded-xl border p-4 text-right transition ${selectedSlug === page.slug ? "border-primary bg-accent" : "bg-card hover:border-primary"}`}><span className="block font-bold">{pageLabels[page.slug] ?? page.title}</span><span className="mt-1 block text-xs text-muted-foreground" dir="ltr">/{page.slug}</span></button>)}</div>
    {selected && <div className="overflow-hidden rounded-xl border bg-card shadow-sm"><div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2"><button type="button" title="عريض" onClick={() => editor?.chain().focus().toggleBold().run()} className="toolbar-button"><Bold size={16} /></button><button type="button" title="مائل" onClick={() => editor?.chain().focus().toggleItalic().run()} className="toolbar-button"><Italic size={16} /></button><button type="button" title="قائمة" onClick={() => editor?.chain().focus().toggleBulletList().run()} className="toolbar-button"><List size={16} /></button><select aria-label="نمط العنوان" defaultValue="paragraph" onChange={(event) => { const value = event.target.value; if (value === "paragraph") editor?.chain().focus().setParagraph().run(); else editor?.chain().focus().toggleHeading({ level: Number(value) as 1 | 2 }).run(); }} className="h-8 rounded border bg-card px-2 text-xs"><option value="paragraph">نص عادي</option><option value="1">عنوان رئيسي</option><option value="2">عنوان فرعي</option></select></div><EditorContent editor={editor} className="prose prose-sm min-h-64 max-w-none p-5 outline-none" /></div>}
    <button type="button" disabled={saving || !selected || !editor} onClick={() => void save()} className="interactive-button flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"><Save size={17} />{saving ? "جاري الحفظ..." : "حفظ الصفحة"}</button>
  </section>;
}
