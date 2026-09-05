"use client";

import { ArrowRight, Save, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";

type Tab = "contact" | "live" | "maintenance" | "password";
type LiveStream = { enabled?: boolean; platform?: string; url?: string };
type Settings = {
  contact_phone: string | null; contact_address: string | null; contact_whatsapp: string | null;
  social_facebook: string | null; social_twitter: string | null; social_youtube: string | null;
  live_streams: LiveStream | null;
  maintenance_enabled: boolean | null; maintenance_message: string | null; maintenance_ends_at: string | null;
};
const tabs: [Tab, string][] = [["contact", "التواصل"], ["live", "البث المباشر"], ["maintenance", "الصيانة"], ["password", "طلبات الباسورد"]];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("contact");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [live, setLive] = useState<LiveStream>({ enabled: false, platform: "", url: "" });
  const [maintenanceEnds, setMaintenanceEnds] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(""); const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings").then(async (response) => {
      const result = (await response.json()) as { settings?: Settings; error?: string };
      if (!response.ok) setError(result.error ?? "خطأ في تحميل الإعدادات");
      else if (result.settings) {
        setSettings(result.settings);
        const streams = (result.settings.live_streams ?? {}) as LiveStream;
        setLive({ enabled: streams.enabled === true, platform: streams.platform ?? "", url: streams.url ?? "" });
        setMaintenanceEnds(result.settings.maintenance_ends_at ? new Date(result.settings.maintenance_ends_at).toISOString().slice(0, 16) : "");
      }
      setLoading(false);
    });
  }, []);

  async function save() {
    if (!settings) return;
    setBusy(true); setError(""); setMessage("");
    const patch: Record<string, unknown> = {
      contact_phone: settings.contact_phone ?? "", contact_address: settings.contact_address ?? "", contact_whatsapp: settings.contact_whatsapp ?? "",
      social_facebook: settings.social_facebook ?? "", social_twitter: settings.social_twitter ?? "", social_youtube: settings.social_youtube ?? "",
      live_streams: { enabled: live.enabled, platform: live.platform, url: live.url },
      maintenance_enabled: settings.maintenance_enabled === true,
      maintenance_message: settings.maintenance_message ?? "",
      maintenance_ends_at: maintenanceEnds ? new Date(maintenanceEnds).toISOString() : null,
    };
    const response = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const result = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) setError(result.error ?? "حدث خطأ");
    else setMessage(result.message ?? "تم الحفظ");
    setBusy(false);
  }

  const set = (key: keyof Settings, value: string) => setSettings(current => current ? { ...current, [key]: value } : current);
  return <main className="min-h-screen flex-1 bg-background p-4 text-foreground sm:p-8"><div className="mx-auto max-w-5xl animate-rise-in"><button onClick={() => history.back()} className="interactive-button mb-5 flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted"><ArrowRight size={16} />رجوع</button><div className="mb-6"><p className="text-sm font-semibold text-primary">الإعدادات والأمان</p><h1 className="mt-1 text-2xl font-black">إعدادات الموقع</h1></div>
    {message && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</p>}
    {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
    {loading ? <p className="p-10 text-center text-sm text-muted-foreground">جاري تحميل الإعدادات...</p> : settings && <>
      <section className="overflow-hidden rounded-xl border bg-card shadow-sm"><div className="flex overflow-x-auto border-b p-2">{tabs.map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`interactive-button whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm ${tab === key ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted"}`}>{label}</button>)}</div><div className="p-4 sm:p-6">
        {tab === "contact" && <div className="grid gap-4 sm:grid-cols-2"><Input label="رقم الهاتف" value={settings.contact_phone ?? ""} onChange={v => set("contact_phone", v)} placeholder="+20 100 000 0000" /><Input label="رقم واتساب" value={settings.contact_whatsapp ?? ""} onChange={v => set("contact_whatsapp", v)} placeholder="https://wa.me/201000" /><Input label="العنوان" value={settings.contact_address ?? ""} onChange={v => set("contact_address", v)} placeholder="المدينة، العنوان" /><Input label="فيسبوك" value={settings.social_facebook ?? ""} onChange={v => set("social_facebook", v)} placeholder="https://facebook.com/..." /><Input label="تويتر / X" value={settings.social_twitter ?? ""} onChange={v => set("social_twitter", v)} placeholder="https://x.com/..." /><Input label="يوتيوب" value={settings.social_youtube ?? ""} onChange={v => set("social_youtube", v)} placeholder="https://youtube.com/..." /></div>}
        {tab === "live" && <div className="space-y-4"><Toggle label="تفعيل البث المباشر" enabled={live.enabled === true} onChange={v => setLive(current => ({ ...current, enabled: v }))} /><div className="grid gap-4 sm:grid-cols-2"><Input label="منصة البث" value={live.platform ?? ""} onChange={v => setLive(current => ({ ...current, platform: v }))} placeholder="YouTube أو Facebook" /><Input label="رابط البث" dir="ltr" value={live.url ?? ""} onChange={v => setLive(current => ({ ...current, url: v }))} placeholder="https://youtube.com/live/..." /></div></div>}
        {tab === "maintenance" && <div className="space-y-4"><Toggle label="تفعيل وضع الصيانة (الموقع يقفل للزوار)" enabled={settings.maintenance_enabled === true} onChange={v => setSettings(current => current ? { ...current, maintenance_enabled: v } : current)} /><div className="grid gap-4 sm:grid-cols-2"><Input label="رسالة الصيانة" value={settings.maintenance_message ?? ""} onChange={v => set("maintenance_message", v)} placeholder="الموقع تحت الصيانة حالياً" /><label className="text-sm font-semibold">ينتهي في (اختياري)<input type="datetime-local" dir="ltr" value={maintenanceEnds} onChange={event => setMaintenanceEnds(event.target.value)} className="admin-input mt-1.5" /></label></div></div>}
        {tab === "password" && <div className="flex items-center gap-3 rounded-lg border p-4"><Settings2 size={20} className="text-primary" /><div className="flex-1"><p className="text-sm font-bold">طلبات استعادة كلمة المرور</p><p className="text-xs text-muted-foreground">لوحة الموافقة والرفض — للمدير العام</p></div><a href="/password-requests" className="interactive-button rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">فتح اللوحة</a></div>}
      </div></section>
      <button disabled={busy} onClick={save} className="interactive-button mt-6 flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"><Save size={17} />{busy ? "جاري الحفظ..." : "حفظ الإعدادات"}</button>
    </>}</div></main>;
}
function Input({ label, value, onChange, placeholder, dir }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; dir?: string }) { return <label className="text-sm font-semibold">{label}<input value={value} dir={dir} onChange={event => onChange(event.target.value)} className="admin-input mt-1.5" placeholder={placeholder} /></label>; }
function Toggle({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (v: boolean) => void }) { return <label className="flex cursor-pointer items-center justify-between rounded-lg border p-4 text-sm font-semibold hover:border-primary"><span>{label}</span><button type="button" onClick={() => onChange(!enabled)} aria-label={label} className={`h-6 w-11 rounded-full p-1 ${enabled ? "bg-primary" : "bg-muted"}`}><span className={`block size-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : ""}`} /></button></label>; }

