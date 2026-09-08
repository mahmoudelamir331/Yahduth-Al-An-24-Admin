"use client";

import { useEffect, useState } from "react";

type LiveStream = { id: string; enabled: boolean; youtubeId: string; title: string; channel: string };

const emptyStream = (): LiveStream => ({ id: crypto.randomUUID(), enabled: true, youtubeId: "", title: "", channel: "" });

export default function LiveStreamsManager() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" }).then(async response => {
      const result = await response.json() as { settings?: { live_streams?: LiveStream[] }; error?: string };
      if (!response.ok) throw new Error(result.error ?? "تعذر تحميل البثوث");
      setStreams(Array.isArray(result.settings?.live_streams) ? result.settings.live_streams : []);
    }).catch(reason => setError(reason instanceof Error ? reason.message : "تعذر تحميل البثوث")).finally(() => setLoading(false));
  }, []);

  function update(id: string, patch: Partial<LiveStream>) { setStreams(current => current.map(stream => stream.id === id ? { ...stream, ...patch } : stream)); }

  async function save() {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ live_streams: streams }) });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(result.error ?? "تعذر حفظ البثوث");
      setMessage(result.message ?? "تم حفظ البثوث");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "تعذر حفظ البثوث"); }
    finally { setSaving(false); }
  }

  if (loading) return <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">جاري تحميل قنوات البث...</p>;
  return <section className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black">قنوات البث المباشر</h2><p className="mt-1 text-xs text-muted-foreground">إدارة القنوات الظاهرة في الموقع العام.</p></div><button type="button" onClick={() => setStreams(current => [...current, emptyStream()])} className="interactive-button rounded-lg border px-3 py-2 text-xs font-bold">إضافة قناة</button></div>{error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}{message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}{streams.length === 0 && <p className="rounded-xl border-dashed p-8 text-center text-sm text-muted-foreground">لا توجد قنوات مضافة حالياً.</p>}{streams.map((stream, index) => <div key={stream.id} className="space-y-3 rounded-xl border bg-card p-4"><div className="flex items-center justify-between"><strong className="text-sm text-primary">قناة {index + 1}</strong><div className="flex items-center gap-3"><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={stream.enabled} onChange={event => update(stream.id, { enabled: event.target.checked })} /> مفعلة</label><button type="button" onClick={() => setStreams(current => current.filter(item => item.id !== stream.id))} className="text-xs font-bold text-rose-700">حذف</button></div></div><div className="grid gap-3 sm:grid-cols-2"><Input label="القناة" value={stream.channel} onChange={value => update(stream.id, { channel: value })} placeholder="الجزيرة الإخبارية مباشر" /><Input label="العنوان" value={stream.title} onChange={value => update(stream.id, { title: value })} placeholder="بث مباشر للأخبار" /><Input label="رابط البث" value={stream.youtubeId} onChange={value => update(stream.id, { youtubeId: value })} placeholder="https://www.youtube.com/watch?v=..." dir="ltr" /></div></div>)}<button type="button" disabled={saving} onClick={() => void save()} className="interactive-button rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">{saving ? "جاري الحفظ..." : "حفظ قنوات البث"}</button></section>;
}

function Input({ label, value, onChange, placeholder, dir }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; dir?: string }) { return <label className="text-sm font-semibold">{label}<input className="admin-input mt-1.5" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} dir={dir} /></label>; }
