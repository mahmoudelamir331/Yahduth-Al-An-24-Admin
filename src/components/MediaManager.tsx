"use client";

import { ChangeEvent, useState } from "react";
import { CheckCircle2, ImagePlus, UploadCloud, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MediaManager() {
  const [fileName, setFileName] = useState("");
  const [position, setPosition] = useState("bottom-right");
  const [compressed, setCompressed] = useState(false);
  const [isUrl, setIsUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [enableWatermark, setEnableWatermark] = useState(true);
  
  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUrl(false);
    setFileName(file.name);
    setCompressed(false);
    window.setTimeout(() => setCompressed(true), 500);
  }

  function handleUrlSubmit(e: React.FormEvent) {
      e.preventDefault();
      if(!urlInput) return;
      setIsUrl(true);
      setFileName(urlInput.split('/').pop() || 'صورة من رابط');
      setCompressed(false);
      window.setTimeout(() => setCompressed(true), 500);
  }

  const positions = [
      { id: "top-right", label: "أعلى اليمين" },
      { id: "top-left", label: "أعلى اليسار" },
      { id: "center", label: "في المنتصف" },
      { id: "bottom-right", label: "أسفل اليمين" },
      { id: "bottom-left", label: "أسفل اليسار" }
  ];

  return (
    <div className="flex flex-col mb-10">
      <div className="mb-8">
        <p className="text-primary font-bold text-sm mb-1">مكتبة المحتوى</p>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-foreground to-foreground/60 block">إدارة الميديا</h1>
        <span className="text-sm opacity-70 mt-2 block">ارفع الصور والفيديوهات، طبق العلامة المائية، وقم بتهيئة ملفاتك للنشر.</span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        
        {/* Upload Section */}
        <section className="glass-card p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-glass-border/30">
            <div className="bg-primary/20 p-3 rounded-full text-primary">
              <UploadCloud size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">رفع ملف جديد</h2>
              <p className="text-sm opacity-70 mt-1">الملفات بيتم ضغطها وتصغير حجمها تلقائياً قبل الحفظ</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
              <form onSubmit={handleUrlSubmit} className="flex items-center gap-2 relative">
                  <div className="absolute right-3 opacity-50"><LinkIcon size={18}/></div>
                  <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="أو حط رابط الصورة هنا لو عندك رابط مباشر..." className="glass-input flex-1 h-12 pr-10 text-sm" dir="ltr" />
                  <button type="submit" className="glass-button glass-button-secondary h-12 px-6 shrink-0">جلب الرابط</button>
              </form>

              <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-glass-border/50"></div>
                  </div>
                  <div className="relative flex justify-center text-sm font-medium">
                      <span className="px-3 bg-background text-foreground opacity-60">أو من الجهاز</span>
                  </div>
              </div>

              <label className="flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed border-primary/40 focus-within:border-primary focus-within:bg-primary/5 rounded-2xl cursor-pointer hover:bg-white/40 dark:hover:bg-black/20 transition-all bg-white/20 dark:bg-black/10">
                <input type="file" className="sr-only" accept="image/*,video/*" onChange={choose} />
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-sm">
                    <ImagePlus size={32} />
                </div>
                <div className="text-center">
                    <strong className="block text-lg mb-1">{fileName ? (isUrl ? "تم جلب الصورة من الرابط" : fileName) : "اسحب الملف هنا أو اضغط للاختيار"}</strong>
                    <small className="opacity-60">JPG, PNG, WEBP, MP4 (بحد أقصى 10MB)</small>
                </div>
              </label>
              
              {fileName && (
                  <div className="bg-white/50 dark:bg-black/30 border border-glass-border p-4 rounded-xl flex items-center justify-between text-sm shadow-sm animate-pulse">
                      <div className="flex flex-col">
                          <span className="font-bold flex items-center gap-2 mb-1">
                              {compressed ? <CheckCircle2 size={16} className="text-green-500" /> : <UploadCloud size={16} className="text-blue-500 animate-bounce" />}
                              {compressed ? "تم ضغط الصورة وتجهيزها بنجاح" : "جارٍ معالجة وضغط الصورة..."}
                          </span>
                          <span className="text-xs opacity-60 font-mono truncate max-w-[200px] sm:max-w-xs">{fileName}</span>
                      </div>
                      <b className={cn("px-3 py-1 rounded-full text-xs", compressed ? "bg-green-500/20 text-green-700 dark:text-green-400" : "bg-blue-500/20 text-blue-700 dark:text-blue-400")}>
                          {compressed ? "جاهز" : "معالجة..."}
                      </b>
                  </div>
              )}
          </div>
        </section>

        {/* Watermark Section */}
        <section className="glass-card p-6 md:p-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-purple-500/20 p-3 rounded-full text-purple-500 font-bold text-xl leading-none">
              ✦
            </div>
            <div>
              <h2 className="text-xl font-bold">العلامة المائية (Watermark)</h2>
              <p className="text-sm opacity-70 mt-1">حط لوجو الموقع على صورك لحماية حقوق النشر</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
              
              <label className="flex items-center justify-between bg-white/50 dark:bg-black/40 border border-glass-border/40 p-4 rounded-xl cursor-pointer hover:bg-white/70 dark:hover:bg-black/60 transition-colors shadow-sm mb-2">
                <div>
                  <strong className="block mb-1">إضافة العلامة المائية</strong>
                  <span className="text-xs opacity-70">سيتم دمج الشعار تلقائياً على الصور الصالحة فقط</span>
                </div>
                <div className="relative w-12 h-6 flex shrink-0">
                  <input type="checkbox" className="peer sr-only" checked={enableWatermark} onChange={(e) => setEnableWatermark(e.target.checked)} />
                  <div className="absolute inset-0 rounded-full bg-slate-300 dark:bg-slate-700 peer-checked:bg-purple-500 transition-colors duration-300 shadow-inner"></div>
                  <div className={cn("absolute right-1 top-1 bottom-1 w-4 h-4 bg-white rounded-full shadow-md z-10 transition-all", enableWatermark ? "translate-x-[-24px]" : "")} />
                </div>
              </label>

              <div className={cn("flex flex-col gap-6 transition-all duration-300", !enableWatermark && "opacity-50 pointer-events-none")}>
                  <div className="aspect-video rounded-xl border border-glass-border/50 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 relative overflow-hidden shadow-inner flex items-center justify-center group">
                      <div className="absolute inset-4 border border-white/20 dark:border-white/10 border-dashed rounded-lg pointer-events-none"></div>
                      <span className="opacity-40 font-bold tracking-widest text-lg">معاينة الصورة</span>
                      
                      {/* Watermark Logo Simulation (50% Opacity + Drop shadow) */}
                      <div className={cn(
                          "absolute px-3 py-1.5 text-black dark:text-white rounded-lg text-lg font-bold transition-all duration-500 opacity-50 drop-shadow-md",
                          position === 'top-right' ? 'top-6 right-6' : 
                          position === 'top-left' ? 'top-6 left-6' : 
                          position === 'center' ? 'top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 scale-150' : 
                          position === 'bottom-right' ? 'bottom-6 right-6' : 
                          'bottom-6 left-6'
                      )}>
                      <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-primary rounded-full shrink-0"></div>
                          يحدث الآن 24
                      </div>
                  </div>
              </div>

              <div className="flex flex-col gap-2 border-b border-glass-border/30 pb-6">
                  <label className="text-sm font-semibold opacity-90 pl-1">مكان العلامة المائية</label>
                  <select value={position} onChange={(event) => setPosition(event.target.value)} className="glass-input h-11">
                      {positions.map(p => <option key={p.id} value={p.id} className="text-black">{p.label}</option>)}
                  </select>
              </div>

              <button className="glass-button glass-button-primary h-12 w-full mt-2 shadow-purple-500/20 bg-purple-600 hover:bg-purple-700 !border-purple-500/50" type="button" disabled={!fileName || !compressed}>
                  تطبيق {enableWatermark ? "العلامة المائية و" : ""} تهيئة الملف للرفع
              </button>
          </div>
          </div>
        </section>

      </div>
    </div>
  );
}
