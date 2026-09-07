"use client";

import { Megaphone, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type Ad = { id: string; title: string; url: string; active: boolean };

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [title, setTitle] = useState(""); const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/ads", { cache: "no-store" }).then(async response => { const result = await response.json() as { ads?: Ad[]; error?: string }; if (!response.ok) throw new Error(result.error ?? "تعذر تحميل الإعلانات"); setAds(result.ads ?? []); }).catch(loadError => setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الإعلانات")); }, []);
  async function addAd() {
    if (!title.trim()) return;
    const response = await fetch("/api/ads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, url }) });
    const result = await response.json() as { ad?: Ad; error?: string };
    if (!response.ok || !result.ad) { setError(result.error ?? "تعذر إضافة الإعلان"); return; }
    setAds(current => [...current, result.ad!]); setTitle(""); setUrl("");
  }
  async function removeAd(id: string) { const response = await fetch("/api/ads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); if (!response.ok) { const result = await response.json() as { error?: string }; setError(result.error ?? "تعذر حذف الإعلان"); return; } setAds(current => current.filter(ad => ad.id !== id)); }
  return <main className="min-h-screen flex-1 bg-background p-4 text-foreground sm:p-8"><div className="mx-auto max-w-4xl"><p className="text-sm font-semibold text-primary">الإعلانات</p><h1 className="mt-1 mb-6 text-2xl font-black">إدارة الإعلانات</h1>{error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<section className="rounded-xl border bg-card p-5 shadow-sm"><div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><input value={title} onChange={event => setTitle(event.target.value)} placeholder="عنوان الإعلان" className="admin-input" /><input dir="ltr" value={url} onChange={event => setUrl(event.target.value)} placeholder="رابط الإعلان" className="admin-input" /><button onClick={addAd} className="interactive-button flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"><Plus size={16} />إضافة</button></div></section><section className="mt-5 rounded-xl border bg-card shadow-sm">{ads.length === 0 ? <p className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Megaphone size={20} />مفيش إعلانات مضافة — ضيف أول إعلان من فوق</p> : <ul className="divide-y">{ads.map(ad => <li key={ad.id} className="flex items-center justify-between gap-3 p-4"><div><p className="text-sm font-bold">{ad.title}</p><p dir="ltr" className="text-xs text-muted-foreground">{ad.url}</p></div><button onClick={() => removeAd(ad.id)} aria-label="حذف الإعلان" className="interactive-button grid size-9 place-items-center rounded-lg border text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><Trash2 size={16} /></button></li>)}</ul>}</section></div></main>;
}
