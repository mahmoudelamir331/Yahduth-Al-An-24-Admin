"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Briefcase, Code2, Image as ImageIcon, Loader2, Megaphone, Plus, Power, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

type Ad = {
  id: string;
  name: string;
  placement: string;
  type: "image" | "adsense";
  image_url: string | null;
  target_url: string | null;
  adsense_code: string | null;
  storage_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const placementLabels: Record<string, string> = {
  header: "أعلى الموقع",
  sidebar: "الشريط الجانبي",
  article: "داخل الخبر",
  bottom: "أسفل الموقع",
};

export default function AdsManager() {
  const supabase = useMemo(() => createClient(), []);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [adType, setAdType] = useState<"image" | "adsense">("image");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadAds = useCallback(async () => {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) {
      setNotice("لا توجد جلسة تسجيل دخول صالحة.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/admin/ads", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    const result = await response.json();
    if (!response.ok) {
      setNotice(result.message ?? "تعذر تحميل الإعلانات.");
      setAds([]);
    } else {
      setAds((result.ads ?? []) as Ad[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAds(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAds]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) {
      setNotice("انتهت جلسة تسجيل الدخول.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload = new FormData();
    payload.append("name", String(form.get("name") ?? "").trim());
    payload.append("placement", String(form.get("placement") ?? "header"));
    payload.append("type", adType);

    if (adType === "image") {
      payload.append("targetUrl", String(form.get("targetUrl") ?? "").trim());
      payload.append("imageUrl", String(form.get("imageUrl") ?? "").trim());
      if (selectedFile) {
        payload.append("imageFile", selectedFile);
      }
    } else {
      payload.append("adsenseCode", String(form.get("adsenseCode") ?? "").trim());
    }

    setSubmitting(true);
    setNotice("جارٍ حفظ الإعلان...");

    const response = await fetch("/api/admin/ads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: payload,
    });
    const result = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setNotice(result.message ?? "تعذر حفظ الإعلان.");
      return;
    }

    setNotice(result.message ?? "تم حفظ الإعلان بنجاح.");
    event.currentTarget.reset();
    setAdType("image");
    setSelectedFile(null);
    await loadAds();
  }

  async function updateAd(id: string, nextState?: boolean) {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) {
      setNotice("انتهت جلسة تسجيل الدخول.");
      return;
    }

    setBusyId(id);
    const response = await fetch("/api/admin/ads", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ id, isActive: typeof nextState === "boolean" ? nextState : undefined }),
    });
    const result = await response.json();
    setBusyId("");

    if (!response.ok) {
      setNotice(result.message ?? "تعذر تحديث الإعلان.");
      return;
    }

    setNotice(result.message ?? "تم تحديث الإعلان.");
    await loadAds();
  }

  async function deleteAd(id: string) {
    if (!window.confirm("متأكد إنك عايز تحذف الإعلان ده؟")) return;

    const session = (await supabase.auth.getSession()).data.session;
    if (!session) {
      setNotice("انتهت جلسة تسجيل الدخول.");
      return;
    }

    setBusyId(id);
    const response = await fetch("/api/admin/ads", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ id }),
    });
    const result = await response.json();
    setBusyId("");

    if (!response.ok) {
      setNotice(result.message ?? "تعذر حذف الإعلان.");
      return;
    }

    setNotice(result.message ?? "تم حذف الإعلان.");
    await loadAds();
  }

  if (loading) {
    return (
      <div className="min-h-[360px] grid place-items-center font-bold text-primary animate-pulse">
        جاري تحميل الإعلانات...
      </div>
    );
  }

  return (
    <div className="flex flex-col mb-10">
      <div className="mb-8">
        <p className="text-primary font-bold text-sm mb-1">مصادر الدخل</p>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-foreground to-foreground/60 block">
          إدارة المساحات الإعلانية
        </h1>
        <span className="text-sm opacity-70 mt-2 block">
          أضف البنرات أو أكواد AdSense وحدد مكان ظهورها في الموقع بسهولة.
        </span>
      </div>

      {notice && (
        <div className="mb-5 bg-primary/10 text-primary border border-primary/30 px-4 py-3 rounded-xl text-sm">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
        <section className="glass-card p-6 md:p-8 order-2 xl:order-1">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-glass-border/30">
            <div className="bg-amber-500/20 p-3 rounded-full text-amber-500">
              <Megaphone size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">إضافة إعلان جديد</h2>
              <p className="text-sm opacity-70 mt-1">اعمل بنر صورة أو كود AdSense وخلّي الظهور مباشر في الموقع.</p>
            </div>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-semibold opacity-90 pl-1">اسم الإعلان / الحملة</label>
              <input
                name="name"
                className="glass-input h-11"
                placeholder="مثال: حملة الجمعة البيضاء"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold opacity-90 pl-1">نوع الإعلان</label>
              <select name="type" className="glass-input h-11" value={adType} onChange={(event) => setAdType(event.target.value as "image" | "adsense")}>
                <option value="image" className="text-black">صورة / بنر إعلاني</option>
                <option value="adsense" className="text-black">كود إعلانات AdSense</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold opacity-90 pl-1">مكان الظهور بالموقع</label>
              <select name="placement" className="glass-input h-11" defaultValue="header">
                <option value="header" className="text-black">أعلى الموقع</option>
                <option value="sidebar" className="text-black">الشريط الجانبي</option>
                <option value="article" className="text-black">داخل الخبر</option>
                <option value="bottom" className="text-black">أسفل الموقع</option>
              </select>
            </div>

            {adType === "image" ? (
              <>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-semibold opacity-90 pl-1">ارفع الصورة</label>
                  <label className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-primary/30 rounded-2xl cursor-pointer hover:bg-white/30 dark:hover:bg-black/20 transition-colors">
                    <input type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                    <Upload size={24} className="text-primary" />
                    <strong className="text-sm">{selectedFile ? selectedFile.name : "اضغط لاختيار ملف صورة"}</strong>
                    <span className="text-xs opacity-60">أو اتركه فارغًا واستخدم رابط صورة مباشر</span>
                  </label>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold opacity-90 pl-1">رابط الصورة المباشر</label>
                  <input name="imageUrl" className="glass-input h-11" dir="ltr" placeholder="https://..." />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold opacity-90 pl-1">رابط التحويل</label>
                  <input name="targetUrl" className="glass-input h-11" dir="ltr" placeholder="https://..." required />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold opacity-90 pl-1">كود AdSense</label>
                <textarea
                  name="adsenseCode"
                  rows={5}
                  className="glass-input resize-y py-3 font-mono"
                  dir="ltr"
                  placeholder="<script async src='https://pagead2.googlesyndication.com/...'></script>"
                  required
                />
              </div>
            )}

            <button className="glass-button glass-button-primary md:col-span-2 h-12 text-lg shadow-xl shadow-primary/20 mt-2" type="submit" disabled={submitting}>
              {submitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
              {submitting ? "جارٍ الحفظ..." : "إضافة الإعلان وتفعيله"}
            </button>
          </form>
        </section>

        <section className="glass-card p-6 md:p-8 order-1 xl:order-2 self-start h-auto xl:sticky xl:top-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-glass-border/30">
            <div className="bg-blue-500/20 p-3 rounded-full text-blue-500">
              <Briefcase size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">المساحات الإعلانية النشطة</h2>
              <p className="text-sm opacity-70 mt-1">{ads.length ? `${ads.length} إعلاناً موجوداً حالياً` : "لا توجد إعلانات محفوظة"}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {ads.length === 0 ? (
              <div className="h-[200px] grid place-items-center opacity-50 text-center bg-white/20 dark:bg-black/10 rounded-xl border border-dashed border-glass-border/50">
                <div>
                  <Code2 size={40} className="mb-3 opacity-60 mx-auto" />
                  <span className="block font-bold">المساحات الإعلانية فارغة</span>
                  <span className="text-sm mt-1 mx-auto block max-w-[220px]">أضف أول إعلان من النموذج لتبدأ الظهور في الموقع</span>
                </div>
              </div>
            ) : (
              ads.map((ad) => (
                <article
                  className="bg-white/40 dark:bg-black/20 border border-glass-border/40 p-4 rounded-xl flex flex-col gap-4 hover:bg-white/60 dark:hover:bg-black/40 transition-colors"
                  key={ad.id}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", ad.type === "adsense" ? "bg-amber-500/10 text-amber-600" : "bg-purple-500/10 text-purple-600")}>
                      {ad.type === "adsense" ? <Code2 size={20} /> : <ImageIcon size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <strong className="font-bold mb-1 block truncate">{ad.name}</strong>
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="bg-white/60 dark:bg-black/40 px-2 py-0.5 rounded-full border border-glass-border/30 shadow-sm">
                          {ad.type === "adsense" ? "AdSense" : "بنر صورة"}
                        </span>
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20 shadow-sm font-bold">
                          {placementLabels[ad.placement] ?? ad.placement}
                        </span>
                        <span className={cn("px-2 py-0.5 rounded-full border shadow-sm font-bold", ad.is_active ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20")}>
                          {ad.is_active ? "نشط" : "موقوف"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {ad.type === "image" && ad.image_url && (
                    <div className="overflow-hidden rounded-lg border border-glass-border/30 bg-white/40">
                      <Image src={ad.image_url} alt={ad.name} width={1200} height={480} unoptimized className="w-full h-40 object-cover" />
                    </div>
                  )}

                  {ad.type === "adsense" && ad.adsense_code && (
                    <pre className="text-[11px] max-h-36 overflow-auto p-3 rounded-lg bg-black/80 text-green-200 whitespace-pre-wrap break-words">
                      {ad.adsense_code}
                    </pre>
                  )}

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs opacity-60">{ad.target_url ?? ad.image_url ?? "بدون رابط"}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={cn("px-3 py-2 rounded-lg text-xs font-bold border transition-colors", ad.is_active ? "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20" : "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20")}
                        onClick={() => void updateAd(ad.id, !ad.is_active)}
                        disabled={busyId === ad.id}
                      >
                        {ad.is_active ? "إيقاف" : "تفعيل"}
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg text-xs font-bold border border-red-500/20 text-red-600 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                        onClick={() => void deleteAd(ad.id)}
                        disabled={busyId === ad.id}
                      >
                        <Trash2 size={14} className="inline-block ml-1" />
                        حذف
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
