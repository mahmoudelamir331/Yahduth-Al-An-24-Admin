"use client";

import { ArrowRight, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NewsEditor from "@/components/NewsEditor";

type Article = { id: string | number; title: string; excerpt: string | null; content: string[] | string; author_name: string | null; published_at: string | null; status: string; cover_image_url: string | null };

export default function EditArticlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/articles/${params.id}`, { cache: "no-store" }).then(async response => {
      const result = await response.json() as { article?: Article; error?: string };
      if (!response.ok || !result.article) throw new Error(result.error ?? "تعذر تحميل الخبر");
      setArticle(result.article);
      setContent(Array.isArray(result.article.content) ? result.article.content.join("\n") : result.article.content ?? "");
    }).catch(reason => setError(reason instanceof Error ? reason.message : "تعذر تحميل الخبر"));
  }, [params.id]);

  async function save() {
    if (!article) return;
    setBusy(true); setError(""); setMessage("");
    const response = await fetch(`/api/articles/${article.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...article, content: content.split(/\n+/).filter(Boolean) }) });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error ?? "تعذر حفظ التعديلات");
    else setMessage("تم حفظ كل تعديلات الخبر بنجاح");
    setBusy(false);
  }

  async function remove() {
    if (!article || busy) return;
    if (!window.confirm("هل أنت متأكد من حذف هذا الخبر نهائياً؟ لا يمكن التراجع بعد الحذف.")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/articles/${article.id}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "تعذر حذف الخبر");
        setBusy(false);
        return;
      }
      router.push("/articles");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر حذف الخبر");
      setBusy(false);
    }
  }

  return <main className="min-h-screen flex-1 bg-background p-4 text-foreground sm:p-8"><div className="mx-auto max-w-5xl"><button onClick={() => router.push("/articles")} className="interactive-button mb-5 flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground"><ArrowRight size={16} />رجوع للأخبار</button><div className="mb-6 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-primary">تحرير الخبر والتحكم في بياناته</p><h1 className="mt-1 text-2xl font-black">تعديل الخبر</h1></div><div className="flex items-center gap-2"><button disabled={busy || !article} onClick={() => void remove()} className="interactive-button flex items-center gap-2 rounded-lg border-rose-300 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60">حذف الخبر</button><button disabled={busy || !article} onClick={() => void save()} className="interactive-button flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"><Save size={17} />{busy ? "جاري الحفظ..." : "حفظ التعديلات"}</button></div></div>{error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}{message && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}{article && <section className="space-y-5 rounded-xl border bg-card p-4 shadow-sm sm:p-8"><label className="block text-sm font-bold">عنوان الخبر<input className="admin-input mt-1.5 text-lg font-bold" value={article.title} onChange={event => setArticle({ ...article, title: event.target.value })} /></label><label className="block text-sm font-bold">اسم الصحفي / الكاتب<input className="admin-input mt-1.5" value={article.author_name ?? ""} onChange={event => setArticle({ ...article, author_name: event.target.value })} placeholder="اسم الصحفي كما سيظهر للزوار" /></label><label className="block text-sm font-bold">الملخص<textarea className="admin-input mt-1.5 min-h-24" value={article.excerpt ?? ""} onChange={event => setArticle({ ...article, excerpt: event.target.value })} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">الحالة<select className="admin-input mt-1.5" value={article.status} onChange={event => setArticle({ ...article, status: event.target.value })}><option value="draft">مسودة</option><option value="review">مراجعة</option><option value="published">منشور</option></select></label><label className="text-sm font-bold">تاريخ النشر<input type="datetime-local" dir="ltr" className="admin-input mt-1.5" value={article.published_at ? new Date(article.published_at).toISOString().slice(0, 16) : ""} onChange={event => setArticle({ ...article, published_at: event.target.value ? new Date(event.target.value).toISOString() : null })} /></label></div><div><p className="mb-1.5 text-sm font-bold">محتوى الخبر</p><NewsEditor initialContent={content} onChange={setContent} /></div></section>}</div></main>;
}
