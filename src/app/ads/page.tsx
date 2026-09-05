"use client";

import { Megaphone, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Ad = { id: number; title: string; url: string; active: boolean };

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [title, setTitle] = useState(""); const [url, setUrl] = useState("");
  function addAd() {
    if (!title.trim()) return;
    setAds(current => [...current, { id: Date.now(), title: title.trim(), url: url.trim(), active: true }]);
    setTitle(""); setUrl("");
  }
  function removeAd(id: number) { setAds(current => current.filter(ad => ad.id !== id)); }
  return <main className="min-h-screen flex-1 bg-background p-4 text-foreground sm:p-8"><div className="mx-auto max-w-4xl"><p className="text-sm font-semibold text-primary">الإعلانات</p><h1 className="mt-1 mb-6 text-2xl font-black">إدارة الإعلانات</h1><section className="rounded-xl border bg-card p-5 shadow-sm"><div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><input value={title} onChange={event => setTitle(event.target.value)} placeholder="عنوان الإعلان" className="admin-input" /><input dir="ltr" value={url} onChange={event => setUrl(event.target.value)} placeholder="رابط الإعلان" className="admin-input" /><button onClick={addAd} className="interactive-button flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"><Plus size={16} />إضافة</button></div></section><section className="mt-5 rounded-xl border bg-card shadow-sm">{ads.length === 0 ? <p className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Megaphone size={20} />مفيش إعلانات مضافة — ضيف أول إعلان من فوق</p> : <ul className="divide-y">{ads.map(ad => <li key={ad.id} className="flex items-center justify-between gap-3 p-4"><div><p className="text-sm font-bold">{ad.title}</p><p dir="ltr" className="text-xs text-muted-foreground">{ad.url}</p></div><button onClick={() => removeAd(ad.id)} aria-label="حذف الإعلان" className="interactive-button grid size-9 place-items-center rounded-lg border text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><Trash2 size={16} /></button></li>)}</ul>}</section></div></main>;
}
