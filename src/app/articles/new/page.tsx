"use client";

import { ArrowRight, ImagePlus, Save, Send } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NewsEditor from "@/components/NewsEditor";

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [content, setContent] = useState("");
  const [savedArticleId, setSavedArticleId] = useState<number | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/categories", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as { categories?: { id: string; name: string; is_active: boolean }[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "تعذر تحميل التصنيفات");
        setCategories((result.categories ?? []).filter((category) => category.is_active));
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "تعذر تحميل التصنيفات"));
  }, []);

  async function upload(file: File) {
    setError("");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/media", { method: "POST", body: form });
    const result = await response.json() as { url?: string; error?: string };
    if (!response.ok || !result.url) {
      setError(result.error ?? "تعذر رفع الغلاف");
      return;
    }
    setCover(result.url);
  }

  async function save(status: "draft" | "published") {
    setBusy(true);
    setError("");
    setMessage("");
    if (!title.trim()) {
      setError("اكتب عنوان الخبر الأول");
      setBusy(false);
      return;
    }

    // content: إما array من الفقرات أو array بعنصر واحد
    const contentArray = typeof content === "string" && content.trim()
      ? content.split(/\n+/).filter(Boolean)
      : [""];

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: contentArray,
          cover_image_url: cover || null,
          category_id: categoryId || null,
          status,
        }),
      });

      const json = await res.json() as {
        ok?: boolean;
        error?: string;
        article?: { id?: number | string };
      };
      const returnedId = Number(json.article?.id);
      if (!res.ok || !json.ok || !Number.isInteger(returnedId) || returnedId <= 0) {
        setError("تعذر الحفظ: " + (json.error || "لم يرجع الخادم رقم الخبر"));
        setBusy(false);
        return;
      }

      setSavedArticleId(returnedId);
      setMessage(status === "published" ? `تم نشر الخبر رقم ${returnedId} ✓` : `تم حفظ الخبر رقم ${returnedId} كمسودة ✓`);
      setTimeout(() => router.push("/articles"), 1200);
    } catch {
      setError("تعذر الاتصال بالخادم لحفظ الخبر");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-3 py-3 sm:px-6 sm:py-5">
        <header className="mb-4 flex items-center justify-between gap-3">
          <button onClick={() => router.push("/")} className="interactive-button flex items-center gap-1 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted"><ArrowRight size={17} />رجوع للوحة</button>
          <div className="flex items-center gap-2">
            <button disabled={busy} onClick={() => save("published")} className="interactive-button flex items-center gap-2 rounded-lg border border-emerald-600 px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-60" title="نشر الخبر مباشرة في الموقع"><Send size={17} />{busy ? "جاري النشر..." : "نشر الآن"}</button>
            <button disabled={busy} onClick={() => save("draft")} className="interactive-button flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"><Save size={17} />{busy ? "جاري الحفظ..." : "حفظ كمسودة"}</button>
          </div>
        </header>
        {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
        {message && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</p>}
        <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-8">
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full border-0 bg-transparent text-2xl font-black outline-none placeholder:text-muted-foreground sm:text-4xl" placeholder="عنوان الخبر" autoFocus />
          <div className="my-6 grid gap-4 sm:grid-cols-[1fr_220px]">
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="admin-input mt-0"><option value="">اختار القسم</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
            <label className="interactive-button flex cursor-pointer items-center justify-center gap-2 rounded-lg border-dashed px-3 py-2 text-sm text-muted-foreground hover:bg-muted"><ImagePlus size={17} />{cover ? "تم رفع الغلاف" : "رفع صورة الغلاف"}<input type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} /></label>
          </div>
          {cover && <Image src={cover} alt="غلاف الخبر" width={1000} height={420} className="mb-6 max-h-72 w-full rounded-lg object-cover" unoptimized />}
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <NewsEditor onChange={setContent} />
            <aside className="rounded-lg border bg-background p-4">
              <h2 className="mb-3 text-sm font-black">معاينة حية</h2>
              <article className="prose prose-sm max-w-none"><h1>{title || "عنوان الخبر"}</h1><div dangerouslySetInnerHTML={{ __html: content || "<p>اكتب محتوى الخبر وسيظهر هنا فوراً.</p>" }} /></article>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
