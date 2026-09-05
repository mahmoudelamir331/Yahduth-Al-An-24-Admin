"use client";

import { Radio, Save } from "lucide-react";
import { useState } from "react";

export default function LivePage() {
  const [enabled, setEnabled] = useState(false);
  const [platform, setPlatform] = useState("YouTube");
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState(false);
  return <main className="min-h-screen flex-1 bg-background p-4 text-foreground sm:p-8"><div className="mx-auto max-w-3xl"><p className="text-sm font-semibold text-primary">البث المباشر</p><h1 className="mt-1 mb-6 text-2xl font-black">إدارة البث</h1><section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6"><label className="flex cursor-pointer items-center justify-between rounded-lg border p-4 text-sm font-semibold hover:border-primary"><span>تفعيل البث المباشر</span><button type="button" onClick={() => setEnabled(!enabled)} aria-label="تفعيل البث" className={`h-6 w-11 rounded-full p-1 transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}><span className={`block size-4 rounded-full bg-white transition-transform ${enabled ? "-translate-x-5" : ""}`} /></button></label><label className="mt-4 block text-sm font-semibold">منصة البث<input value={platform} onChange={event => setPlatform(event.target.value)} className="admin-input mt-1.5" placeholder="YouTube" /></label><label className="mt-4 block text-sm font-semibold">رابط البث<input dir="ltr" value={url} onChange={event => setUrl(event.target.value)} className="admin-input mt-1.5" placeholder="https://youtube.com/live/..." /></label><button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="interactive-button mt-6 flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"><Save size={16} />{saved ? "تم الحفظ" : "حفظ الإعدادات"}</button><p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Radio size={14} className={enabled ? "text-rose-600" : ""} />{enabled ? "البث مفعل حاليًا — بيظهر في الموقع الرئيسي" : "البث متوقف حاليًا"}</p></section></div></main>;
}
