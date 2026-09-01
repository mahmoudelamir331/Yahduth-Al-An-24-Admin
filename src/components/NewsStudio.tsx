"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Bold, CalendarClock, Check, Italic, List, Save, Star, Zap, Search, PlusCircle, AlertCircle, Edit3 } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import AdvancedNewsEditor from "@/components/AdvancedNewsEditor";
import { cn } from "@/lib/utils";

type Article = { id: string; title: string; excerpt: string; content: string; status: "draft" | "scheduled" | "published" | "archived" | "review"; isUrgent: boolean; isHeadline: boolean; scheduledFor: string; updatedAt: string };
const draftKey = "yahduth-news-draft";

const statusConfig = {
    draft: { label: "مسودة", color: "bg-gray-500/20 text-gray-500 border-gray-500/30" },
    review: { label: "قيد المراجعة", color: "bg-amber-500/20 text-amber-600 border-amber-500/30" },
    scheduled: { label: "مجدول", color: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
    published: { label: "منشور", color: "bg-green-500/20 text-green-500 border-green-500/30" },
    archived: { label: "مؤرشف", color: "bg-slate-500/20 text-slate-500 border-slate-500/30" }
};

export default function NewsStudio({ canPublish = true, canReview = false }: { canPublish?: boolean; canReview?: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Article | null>(() => {
    if (typeof window === "undefined") return null;
    const draft = window.localStorage.getItem(draftKey);
    if (!draft) return null;
    try { return JSON.parse(draft) as Article; } catch { return null; }
  });
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  
  const loadArticles = useCallback(async () => { 
      const { data, error } = await supabase.from("articles").select("id,title,excerpt,content,status,is_urgent,is_headline,scheduled_for,updated_at").order("updated_at", { ascending: false }); 
      if (error) setNotice("تعذر تحميل الأخبار: " + error.message); 
      else setArticles((data ?? []).map((item) => ({ id: item.id, title: item.title, excerpt: item.excerpt, content: Array.isArray(item.content) ? item.content.join("<p>") : String(item.content ?? ""), status: item.status, isUrgent: item.is_urgent, isHeadline: item.is_headline, scheduledFor: item.scheduled_for ? item.scheduled_for.slice(0, 16) : "", updatedAt: new Date(item.updated_at).toLocaleDateString("ar-EG") }))); 
      setLoading(false); 
  }, [supabase]);
  
    useEffect(() => {
            const timer = window.setTimeout(() => void loadArticles(), 0);
            return () => window.clearTimeout(timer);
    }, [loadArticles]);
  useEffect(() => { 
      if (!editing) return; 
      const timer = window.setTimeout(() => { localStorage.setItem(draftKey, JSON.stringify(editing)); setSaved(true); }, 500); 
      return () => window.clearTimeout(timer); 
  }, [editing]);
  
  const filtered = articles.filter((article) => article.title.includes(search) || article.excerpt.includes(search));
  
  function update(patch: Partial<Article>) { setEditing((current) => current ? { ...current, ...patch } : current); setSaved(false); }
  function startNew() { setEditing({ id: "new", title: "", excerpt: "", content: "", status: "draft", isUrgent: false, isHeadline: false, scheduledFor: "", updatedAt: "الآن" }); }
  
  async function save(event: FormEvent) { 
      event.preventDefault(); 
      if (!editing?.title.trim()) return; 
      setNotice("جارٍ حفظ الخبر..."); 
      
      // LOGIC: If has publish permission -> 'published' (if not scheduled). If not -> 'review'
      let finalStatus = "review";
      if (canPublish) {
          finalStatus = editing.scheduledFor ? "scheduled" : "published";
      }

      const payload = { 
          title: editing.title.trim(), 
          slug: editing.id === "new" ? `${Date.now()}-${editing.title.trim().toLowerCase().replace(/\\s+/g, "-")}` : undefined, 
          excerpt: editing.excerpt, 
          content: JSON.stringify([editing.content]), 
          status: finalStatus, 
          is_urgent: editing.isUrgent, 
          is_headline: editing.isHeadline, 
          scheduled_for: editing.scheduledFor ? new Date(editing.scheduledFor).toISOString() : null, 
          author_name: "فريق يحدث الآن" 
      }; 
      
      const result = editing.id === "new" ? await supabase.from("articles").insert(payload) : await supabase.from("articles").update(payload).eq("id", editing.id); 
      if (result.error) { setNotice("تعذر حفظ الخبر: " + result.error.message); return; } 
      
      localStorage.removeItem(draftKey); 
      setEditing(null); 
      setNotice(`تم حفظ الخبر ${finalStatus ==='published' ? 'ونشره بنجاح' : 'بنجاح'}.`); 
      await loadArticles(); 
  }

  if (loading) return <div className="min-h-[400px] grid place-items-center font-bold text-primary animate-pulse">جارٍ تحميل الأخبار...</div>;
  
  return (
    <div className="flex flex-col">
        {notice && (
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 glass-card bg-primary/90 text-primary-foreground px-6 py-3 rounded-full flex items-center gap-2 shadow-2xl">
                <Check size={18} /> {notice}
            </div>
        )}
        
        {!editing ? (
            <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <p className="text-primary font-bold text-sm mb-1">مطبخ الأخبار</p>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-foreground to-foreground/60 block">إدارة الأخبار</h1>
                    </div>
                    <button className="glass-button glass-button-primary shadow-xl shadow-primary/20 md:w-auto" onClick={startNew}>
                        <PlusCircle size={20} /> صياغة خبر جديد
                    </button>
                </div>

                <div className="glass-card mb-6 p-4">
                    <div className="relative max-w-xl">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50" size={18} />
                        <input aria-label="بحث في الأخبار" placeholder="ابحث في الأخبار (عنوان، ملخص)..." value={search} onChange={(e) => setSearch(e.target.value)} className="glass-input w-full pr-12 h-12 text-sm" />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map((article) => (
                        <article className="glass-card p-6 flex flex-col justify-between" key={article.id}>
                            <div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {article.isUrgent && <span className="text-[10px] font-bold px-2 py-1 rounded bg-red-500/20 text-red-600 border border-red-500/30">عاجل</span>}
                                    {article.isHeadline && <span className="text-[10px] font-bold px-2 py-1 rounded bg-yellow-500/20 text-yellow-600 border border-yellow-500/30">مانشيت</span>}
                                    <span className={cn("text-[10px] font-bold px-2 py-1 rounded border", statusConfig[article.status as keyof typeof statusConfig]?.color)}>
                                        {statusConfig[article.status as keyof typeof statusConfig]?.label || article.status}
                                    </span>
                                </div>
                                <h2 className="text-lg font-bold mb-2 leading-tight line-clamp-2">{article.title}</h2>
                                <p className="opacity-70 text-sm line-clamp-3 mb-6 relative">{article.excerpt}</p>
                            </div>
                            <div className="flex pt-4 border-t border-glass-border/30">
                                <button className="glass-button w-full bg-white/20 dark:bg-black/20 hover:bg-white/40 dark:hover:bg-black/40 transition-colors" onClick={() => setEditing(article)}>
                                    <Edit3 size={16} /> استكمال / تعديل
                                </button>
                            </div>
                        </article>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full py-20 text-center opacity-60 flex flex-col items-center justify-center gap-2">
                            <AlertCircle size={40} className="mb-2 opacity-50"/>
                            لا توجد أخبار مطابقة لبحثك
                        </div>
                    )}
                </div>
            </>
        ) : (
            <form className="flex flex-col gap-6 max-w-[1000px] mx-auto w-full mb-20" onSubmit={save}>
                <div className="glass-card p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b-0 rounded-b-none">
                    <div>
                        <span className="text-primary font-bold text-xs uppercase tracking-wider mb-1 block">محرر الأخبار المتقدم</span>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-foreground to-foreground/70">{editing.title || "خبر جديد بلا عنوان"}</h2>
                    </div>
                    <span className="text-xs bg-black/5 dark:bg-white/5 py-1.5 px-3 rounded-full flex items-center gap-2 opacity-70 border border-glass-border">
                        <Check size={14} className={saved ? "text-green-500 font-bold" : ""} /> {saved ? "مسودة محفوظة محلياً" : "استمر بالكتابة... المحرر يحفظ تلقائياً"}
                    </span>
                </div>
                
                <div className="glass-card p-6 md:p-8 rounded-none border-y-0 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold opacity-90 pl-2">عنوان الخبر (رئيسي)</label>
                        <input value={editing.title} onChange={(e) => update({ title: e.target.value })} placeholder="اكتب عنواناً جذاباً وواضحاً..." required className="glass-input text-lg font-bold h-14" />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                       <label className="text-sm font-semibold opacity-90 pl-2">الملخص الافتتاحي (Excerpt)</label>
                       <textarea rows={2} value={editing.excerpt} onChange={(e) => update({ excerpt: e.target.value })} placeholder="يظهر في الصفحة الرئيسية ووسائل التواصل الاجتماعي..." className="glass-input resize-none py-3" />
                    </div>

                    <div className="flex flex-col gap-2 relative mt-4">
                        <AdvancedNewsEditor initialContent={editing.content} onChange={(content) => update({ content })} />
                    </div>
                </div>

                <div className="glass-card p-6 border-t-0 rounded-t-none flex flex-col gap-6">
                    <div className={cn("p-4 rounded-xl border flex items-center gap-3", canPublish ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400" : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400")}>
                        <Zap size={20} className="shrink-0" />
                        <div>
                            <strong className="block text-sm">حالة نشر الخبر</strong>
                            <span className="text-xs opacity-80">{canPublish ? "تملك صلاحية 'النشر'. سيتم نشر هذا الخبر مباشرة للجمهور فور حفظه." : "لا تملك صلاحية النشر המباشר. سيُحفظ هذا الخبر كمسودة قيد المراجعة."}</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <label className="glass-card p-4 flex items-center justify-between cursor-pointer border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all">
                             <div className="flex items-center gap-2 font-bold"><Zap size={18} className="text-red-500"/> علامة عاجل</div>
                             <div className="relative w-10 h-5">
                                <input type="checkbox" className="peer sr-only" checked={editing.isUrgent} onChange={(e) => update({ isUrgent: e.target.checked })} />
                                <div className="absolute inset-0 rounded-full bg-slate-300 dark:bg-slate-600 peer-checked:bg-red-500 transition-colors"></div>
                                <div className={cn("absolute top-0.5 bottom-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm", editing.isUrgent ? "left-0.5" : "right-0.5" )}></div>
                             </div>
                        </label>
                        
                        <label className="glass-card p-4 flex items-center justify-between cursor-pointer border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all">
                             <div className="flex items-center gap-2 font-bold"><Star size={18} className="text-yellow-500"/> مانشيت الموقع</div>
                             <div className="relative w-10 h-5">
                                <input type="checkbox" className="peer sr-only" checked={editing.isHeadline} onChange={(e) => update({ isHeadline: e.target.checked })} />
                                <div className="absolute inset-0 rounded-full bg-slate-300 dark:bg-slate-600 peer-checked:bg-yellow-500 transition-colors"></div>
                                <div className={cn("absolute top-0.5 bottom-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm", editing.isHeadline ? "left-0.5" : "right-0.5" )}></div>
                             </div>
                        </label>
                        
                        <div className="glass-card p-4 flex flex-col gap-2 justify-center border-dashed border-2">
                             <div className="flex items-center gap-2 font-bold text-sm"><CalendarClock size={16} className="text-blue-500"/> جدولة النشر لاحقاً</div>
                             <input type="datetime-local" value={editing.scheduledFor} onChange={(e) => update({ scheduledFor: e.target.value })} className="bg-transparent border-b border-glass-border focus:outline-none focus:border-primary text-xs" dir="ltr" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-2 mb-10 pb-10">
                    <button type="button" className="glass-button glass-button-secondary w-full sm:w-auto h-12" onClick={() => setEditing(null)}>
                        إلغاء والعودة
                    </button>
                    <button type="submit" className="glass-button glass-button-primary w-full sm:flex-1 h-12 shadow-2xl shadow-primary/30 text-lg">
                        <Save size={20} /> {canPublish ? (editing.scheduledFor ? "جدولة ونشر في الموعد" : "نشر الخبر الآن") : "حفظ للمراجعة البعدية"}
                    </button>
                </div>
            </form>
        )}
    </div>
  );
}
