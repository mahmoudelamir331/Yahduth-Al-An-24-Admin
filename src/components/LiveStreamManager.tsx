"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Radio, Save, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

type Stream = { id: string; youtubeId: string; title: string; channel: string; enabled: boolean };
const defaults: Stream = { id: "", youtubeId: "", title: "", channel: "", enabled: true };

export default function LiveStreamManager() {
  const supabase = useMemo(() => createClient(), []);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [editing, setEditing] = useState<Stream>(defaults);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, []);
  async function load() {
    const { data, error } = await supabase.from("site_settings").select("live_streams").eq("id", true).maybeSingle();
    if (error) { setNotice("تعذر تحميل قنوات البث: " + error.message); return; }
    setStreams(Array.isArray(data?.live_streams) ? data.live_streams as Stream[] : []);
  }
  function edit(stream: Stream) { setEditing(stream); setNotice(""); }
  function newStream() { setEditing({ ...defaults, id: crypto.randomUUID() }); setNotice(""); }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing.youtubeId.trim() || !editing.title.trim() || !editing.channel.trim()) { setNotice("اكتب اسم القناة والعنوان ورابط البث الأول."); return; }
    try { new URL(editing.youtubeId.trim()); } catch { setNotice("اكتب رابط بث صحيح يبدأ بـ https://"); return; }
    setSaving(true); setNotice("جارٍ حفظ البث...");
    const next = [...streams.filter((item) => item.id !== editing.id), { ...editing, youtubeId: editing.youtubeId.trim(), title: editing.title.trim(), channel: editing.channel.trim() }];
    const { error } = await supabase.from("site_settings").update({ live_streams: next }).eq("id", true);
    setSaving(false);
    if (error) { setNotice("تعذر حفظ البث: " + error.message); return; }
    setStreams(next); setEditing(defaults); setNotice("تم حفظ قناة البث بنجاح ✓");
  }
  async function remove(id: string) {
    const next = streams.filter((item) => item.id !== id);
    setNotice("جارٍ حذف القناة...");
    const { error } = await supabase.from("site_settings").update({ live_streams: next }).eq("id", true);
    if (error) { setNotice("تعذر حذف القناة: " + error.message); return; }
    setStreams(next); setNotice("تم حذف القناة بنجاح ✓");
  }
  return <div className="space-y-6">
    <div><p className="text-primary font-bold text-sm mb-1">البث المباشر</p><h1 className="text-3xl font-bold">إدارة قنوات البث</h1><p className="text-sm opacity-70 mt-2">القنوات هنا بتظهر تلقائيًا في الموقع بعد الحفظ.</p></div>
    <form onSubmit={save} className="glass-card p-6 grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2 flex items-center gap-2"><Radio className="text-primary" size={20}/><strong>{editing.id ? "تعديل قناة" : "إضافة قناة جديدة"}</strong></div>
      <input className="glass-input" placeholder="اسم القناة" value={editing.channel} onChange={(e) => setEditing({ ...editing, channel: e.target.value })} />
      <input className="glass-input" dir="ltr" placeholder="رابط البث الكامل من YouTube أو Facebook أو غيره" value={editing.youtubeId} onChange={(e) => setEditing({ ...editing, youtubeId: e.target.value })} />
      <input className="glass-input md:col-span-2" placeholder="عنوان البث الظاهر للزوار" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} /> القناة مفعّلة</label>
      <div className="md:col-span-2 flex gap-3"><button className="glass-button glass-button-primary" disabled={saving} type="submit"><Save size={17}/> {saving ? "جارٍ الحفظ..." : "حفظ القناة"}</button><button className="glass-button glass-button-secondary" type="button" onClick={newStream}><Plus size={17}/> قناة جديدة</button></div>
      {notice && <p className="md:col-span-2 text-sm text-primary">{notice}</p>}
    </form>
    <div className="grid gap-3">{streams.map((stream) => <div key={stream.id} className="glass-card p-4 flex items-center justify-between gap-4"><div><strong>{stream.channel}</strong><p className="text-sm opacity-70">{stream.title}</p><small className={stream.enabled ? "text-green-600" : "text-amber-600"}>{stream.enabled ? "مفعّل" : "متوقف"}</small></div><div className="flex gap-2"><button className="glass-button glass-button-secondary" type="button" onClick={() => edit(stream)}>تعديل</button><button className="p-2 rounded-lg text-red-500 hover:bg-red-500/10" type="button" onClick={() => void remove(stream.id)} aria-label="حذف"><Trash2 size={17}/></button></div></div>)}</div>
  </div>;
}
