"use client";

import { ArrowRight, ImagePlus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NewsEditor from "@/components/NewsEditor";
import { createClient } from "@/lib/supabase-browser";

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState(""); const [cover, setCover] = useState(""); const [categoryId, setCategoryId] = useState(""); const [content, setContent] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");

  useEffect(() => { createClient().from("categories").select("id,name").eq("is_active", true).order("name").then(({ data }) => setCategories((data ?? []) as { id: number; name: string }[])); }, []);

  async function upload(file: File) {
    setError("");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/media", { method: "POST", body: form });
    const result = await response.json() as { url?: string; error?: string };
    if (!response.ok || !result.url) { setError(result.error ?? "تعذر رفع الغلاف"); return; }
    setCover(result.url);
  }

  async function save() {
    setBusy(true); setError(""); setMessage("");
    if (!title.trim()) { setError("اكتب عنوان الخبر الأول"); setBusy(false); return; }
    const { data: userData } = await createClient().auth.getUser();
    const { error } = await createClient().from("articles").insert({ title: title.trim(), content, cover_image_url: cover || null, category_id: categoryId ? Number(categoryId) : null, status: "draft", author_id: userData.user?.id ?? null });
    if (error) { setError("تعذر الحفظ: " + error.message); setBusy(false); return; }
    setMessage("تم حفظ الخبر كمسودة"); setTimeout(() => router.push("/articles"), 1200);
  }
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto max-w-4xl px-3 py-3 sm:px-6 sm:py-5"><header className="mb-4 flex items-center justify-between"><button onClick={() => router.push("/")} className="interactive-button flex items-center gap-1 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted"><ArrowRight size={17} />رجوع للوحة</button><button disabled={busy} onClick={save} className="interactive-button flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"><Save size={17} />{busy ? "جاري الحفظ..." : "حفظ كمسودة"}</button></header>{error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}{message && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</p>}<section className="rounded-xl border bg-card p-4 shadow-sm sm:p-8"><input value={title} onChange={event => setTitle(event.target.value)} className="w-full border-0 bg-transparent text-2xl font-black outline-none placeholder:text-muted-foreground sm:text-4xl" placeholder="عنوان الخبر" autoFocus /><div className="my-6 grid gap-4 sm:grid-cols-[1fr_220px]"><select value={categoryId} onChange={event => setCategoryId(event.target.value)} className="admin-input mt-0"><option value="">اختار القسم</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select><label className="interactive-button flex cursor-pointer items-center justify-center gap-2 rounded-lg border-dashed px-3 py-2 text-sm text-muted-foreground hover:bg-muted"><ImagePlus size={17} />{cover ? "تم رفع الغلاف ✓" : "رفع صورة الغلاف"}<input type="file" accept="image/*" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) upload(file); }} /></label></div>{cover && <img src={cover} alt="غلاف الخبر" className="mb-6 max-h-72 w-full rounded-lg object-cover" />}<NewsEditor onChange={setContent} /></section></div></main>;
}
