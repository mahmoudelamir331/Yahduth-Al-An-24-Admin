"use client";

import { FormEvent, useState } from "react";
import { Code2, Megaphone, Plus, Save, Image as ImageIcon, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

type Ad = { name: string; placement: string; type: string };

export default function AdsManager() {
  const [ads, setAds] = useState<Ad[]>([]);
  
  function addAd(event: FormEvent<HTMLFormElement>) { 
      event.preventDefault(); 
      const form = new FormData(event.currentTarget); 
      setAds((current) => [...current, { name: String(form.get("name")), placement: String(form.get("placement")), type: String(form.get("type")) }]); 
      event.currentTarget.reset(); 
  }
  
  return (
    <div className="flex flex-col mb-10">
      <div className="mb-8">
        <p className="text-primary font-bold text-sm mb-1">مصادر الدخل</p>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-foreground to-foreground/60 block">إدارة المساحات الإعلانية</h1>
        <span className="text-sm opacity-70 mt-2 block">ضيف البنرات أو أكواد أدسنس (AdSense) وحدد مكان ظهورها في الموقع بسهولة.</span>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
        
        {/* Add Ad Section */}
        <section className="glass-card p-6 md:p-8 order-2 xl:order-1">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-glass-border/30">
            <div className="bg-amber-500/20 p-3 rounded-full text-amber-500">
              <Megaphone size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">إضافة إعلان جديد</h2>
              <p className="text-sm opacity-70 mt-1">ضيف حملة جديدة لتظهر مباشرة في الموقع</p>
            </div>
          </div>
          
          <form className="grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={addAd}>
            <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold opacity-90 pl-1">اسم الإعلان / الحملة</label>
                <input name="name" className="glass-input h-11" placeholder="مثال: حملة الجمعة البيضاء - سامسونج" required />
            </div>
            
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold opacity-90 pl-1">نوع الإعلان</label>
                <select name="type" className="glass-input h-11" defaultValue="banner">
                    <option value="banner" className="text-black">صورة / بنر إعلاني</option>
                    <option value="adsense" className="text-black">كود إعلانات AdSense</option>
                </select>
            </div>
            
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold opacity-90 pl-1">مكان الظهور بالموقع</label>
                <select name="placement" className="glass-input h-11" defaultValue="header">
                    <option value="header" className="text-black">أعلى الموقع (الهيدر)</option>
                    <option value="sidebar" className="text-black">شريط جانبي (السايد بار)</option>
                    <option value="article" className="text-black">وسط محتوى الخبر (Article)</option>
                    <option value="bottom" className="text-black">أسفل الموقع (الفوتر)</option>
                </select>
            </div>
            
            <div className="flex flex-col gap-2 md:col-span-2 mt-2">
                <label className="text-sm font-semibold opacity-90 pl-1">رابط الصورة أو كود الإعلان</label>
                <textarea name="content" rows={4} className="glass-input resize-y py-3 font-mono text-left" dir="ltr" placeholder="<script async src='https://pagead2.googlesyndication...'></script>" required />
            </div>
            
            <button className="glass-button glass-button-primary md:col-span-2 h-12 text-lg shadow-xl shadow-primary/20 mt-2" type="submit">
                <Plus size={20} /> إضافة الإعلان وتفعيله
            </button>
          </form>
        </section>

        {/* Existing Ads List */}
        <section className="glass-card p-6 md:p-8 order-1 xl:order-2 self-start h-auto xl:sticky xl:top-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-glass-border/30">
            <div className="bg-blue-500/20 p-3 rounded-full text-blue-500">
              <Briefcase size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">المساحات الإعلانية النشطة</h2>
              <p className="text-sm opacity-70 mt-1">{ads.length ? `${ads.length} إعلانات نشطة حالياً بالموقع` : "لا توجد إعلانات نشطة"}</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
              {ads.length === 0 ? (
                  <div className="h-[200px] grid place-items-center opacity-50 flex-col gap-2 text-center bg-white/20 dark:bg-black/10 rounded-xl border border-dashed border-glass-border/50">
                      <div>
                        <Code2 size={40} className="mb-3 opacity-60 mx-auto" />
                        <span className="block font-bold">المساحات الإعلانية فارغة</span>
                        <span className="text-sm mt-1 mx-auto block max-w-[200px]">أضف أول إعلان من النموذج لتنشيط المساحات</span>
                      </div>
                  </div>
              ) : (
                  ads.map((ad, index) => (
                      <article className="bg-white/40 dark:bg-black/20 border border-glass-border/40 p-4 rounded-xl flex items-center justify-between gap-4 hover:bg-white/60 dark:hover:bg-black/40 transition-colors" key={`${ad.name}-${index}`}>
                          <div className="flex items-center gap-4">
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", ad.type === "adsense" ? "bg-amber-500/10 text-amber-600" : "bg-purple-500/10 text-purple-600")}>
                                  {ad.type === "adsense" ? <Code2 size={20} /> : <ImageIcon size={20} />}
                              </div>
                              <div className="flex flex-col">
                                  <strong className="font-bold mb-1 truncate max-w-[200px]">{ad.name}</strong>
                                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                      <span className="bg-white/60 dark:bg-black/40 px-2 py-0.5 rounded-full border border-glass-border/30 shadow-sm">
                                          {ad.type === "adsense" ? "إعلانات جوجل AdSense" : "بنر إعلاني مخصص"}
                                      </span>
                                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20 shadow-sm font-bold">
                                          {ad.placement === "header" ? "الهيدر" : ad.placement === "sidebar" ? "السايد بار" : ad.placement === "bottom" ? "الفوتر" : "داخل محتوى الخبر"}
                                      </span>
                                  </div>
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
