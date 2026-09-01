"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Clock3, History, Save, ShieldAlert, AlertTriangle, Facebook, Youtube, Twitter, Link2, ExternalLink, Trash2, Phone, MapPin, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

type Activity = { id: number; action: string; entity_type: string; created_at: string; actor?: { full_name: string }[] | null };
type SocialLinks = { facebook: string; youtube: string; twitter: string; };
type ContactInfo = { phone: string; address: string; whatsapp: string; };

const actionColors: Record<string, string> = {
  create: "bg-green-500/15 text-green-600 border-green-500/30",
  update: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  delete: "bg-red-500/15 text-red-600 border-red-500/30",
  publish: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  login: "bg-amber-500/15 text-amber-600 border-amber-500/30",
};

const actionLabels: Record<string, string> = {
  create: "إنشاء",
  update: "تعديل",
  delete: "حذف",
  publish: "نشر",
  login: "دخول",
};

const socialIcons = [
  { key: "facebook" as const, label: "فيسبوك", icon: Facebook, color: "text-blue-500 bg-blue-500/10", placeholder: "https://facebook.com/yahduthalaan" },
  { key: "youtube" as const, label: "يوتيوب", icon: Youtube, color: "text-red-500 bg-red-500/10", placeholder: "https://youtube.com/@yahduthalaan" },
  { key: "twitter" as const, label: "إكس (تويتر)", icon: Twitter, color: "text-sky-500 bg-sky-500/10", placeholder: "https://x.com/yahduthalaan" },
];

export default function SystemManager() {
  const supabase = useMemo(() => createClient(), []);
  const [maintenance, setMaintenance] = useState(false);
  const [message, setMessage] = useState("الموقع تحت الصيانة حالياً. سنعود قريباً.");
  const [endsAt, setEndsAt] = useState("");
  const [social, setSocial] = useState<SocialLinks>({ facebook: "", youtube: "", twitter: "" });
  const [logs, setLogs] = useState<Activity[]>([]);
  const [contact, setContact] = useState<ContactInfo>({ phone: "", address: "", whatsapp: "" });
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"maintenance" | "social" | "contact" | "logs">("maintenance");
  
  useEffect(() => { void load(); }, []);
  
  async function load() { 
    const [{ data: settings }, { data: activity }] = await Promise.all([
      supabase.from("site_settings")
        .select("maintenance_enabled,maintenance_message,maintenance_ends_at,social_facebook,social_youtube,social_twitter,contact_phone,contact_address,contact_whatsapp")
        .eq("id", true).maybeSingle(), 
      supabase.from("activity_logs")
        .select("id,action,entity_type,created_at,actor:profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(50)
    ]); 
    
    if (settings) { 
      setMaintenance(settings.maintenance_enabled ?? false); 
      setMessage(settings.maintenance_message || "الموقع تحت الصيانة حالياً. سنعود قريباً."); 
      setEndsAt(settings.maintenance_ends_at ? settings.maintenance_ends_at.slice(0, 16) : ""); 
      setSocial({
        facebook: settings.social_facebook || "",
        youtube: settings.social_youtube || "",
        twitter: settings.social_twitter || "",
      });
      setContact({
        phone: settings.contact_phone || "",
        address: settings.contact_address || "",
        whatsapp: settings.contact_whatsapp || "",
      });
    } 
    setLogs((activity ?? []) as Activity[]); 
    setLoading(false);
  }
  
  async function saveMaintenance(event: FormEvent<HTMLFormElement>) { 
    event.preventDefault(); 
    setNotice("جارٍ حفظ إعدادات الصيانة..."); 
    const { error } = await supabase.from("site_settings").upsert({ 
      id: true, 
      maintenance_enabled: maintenance, 
      maintenance_message: message, 
      maintenance_ends_at: endsAt ? new Date(endsAt).toISOString() : null 
    }); 
    if (error) setNotice("تعذر الحفظ: " + error.message); 
    else { 
      setNotice("تم حفظ وضع الصيانة بنجاح ✓"); 
      setTimeout(() => setNotice(""), 3000);
    } 
  }

  async function saveSocial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("جارٍ حفظ روابط السوشيال ميديا...");
    const { error } = await supabase.from("site_settings").upsert({
      id: true,
      social_facebook: social.facebook.trim() || null,
      social_youtube: social.youtube.trim() || null,
      social_twitter: social.twitter.trim() || null,
    });
    if (error) setNotice("تعذر الحفظ: " + error.message);
    else {
      setNotice("تم حفظ روابط السوشيال ميديا بنجاح ✓");
      setTimeout(() => setNotice(""), 3000);
    }
  }

  async function saveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("جارٍ حفظ بيانات الاتصال...");
    const { error } = await supabase.from("site_settings").upsert({
      id: true,
      contact_phone: contact.phone.trim() || null,
      contact_address: contact.address.trim() || null,
      contact_whatsapp: contact.whatsapp.trim() || null,
    });
    if (error) setNotice("تعذر الحفظ: " + error.message);
    else {
      setNotice("تم حفظ بيانات الاتصال بنجاح ✓");
      setTimeout(() => setNotice(""), 3000);
    }
  }

  const tabs = [
    { id: "maintenance" as const, label: "وضع الصيانة", icon: ShieldAlert },
    { id: "social" as const, label: "السوشيال ميديا", icon: Link2 },
    { id: "contact" as const, label: "بيانات الاتصال", icon: Phone },
    { id: "logs" as const, label: "سجل النشاطات", icon: History },
  ];

  if (loading) return <div className="min-h-[400px] grid place-items-center font-bold text-primary animate-pulse">جارٍ تحميل الإعدادات...</div>;
  
  return (
    <div className="flex flex-col mb-10">
      <div className="mb-8">
        <p className="text-primary font-bold text-sm mb-1">التحكم والأمان</p>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-foreground to-foreground/60 block">عمليات النظام</h1>
        <span className="text-sm opacity-70 mt-2 block">إدارة وضع الصيانة الموقع والسوشيال ميديا الديناميكية وسجل النشاطات.</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 bg-white/30 dark:bg-black/20 border border-glass-border/40 p-1.5 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
              activeTab === id 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
                : "hover:bg-white/40 dark:hover:bg-black/30"
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {notice && (
        <div className="mb-4 bg-primary/10 text-primary border border-primary/30 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <span className="text-lg">✓</span> {notice}
        </div>
      )}

      {/* MAINTENANCE TAB */}
      {activeTab === "maintenance" && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
          {/* Settings */}
          <section className="glass-card p-6 md:p-8 self-start">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-glass-border/30">
              <div className="bg-amber-500/20 p-3 rounded-full text-amber-500">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">وضع الصيانة</h2>
                <p className="text-sm opacity-70 mt-1">صفحة الصيانة هتظهر بلوجو الموقع + رسالتك + العداد التنازلي للزوار</p>
              </div>
            </div>
            
            <form onSubmit={saveMaintenance} className="flex flex-col gap-5">
              {/* Main Toggle */}
              <label className="flex items-center justify-between bg-white/50 dark:bg-black/40 border border-glass-border/40 p-4 rounded-xl cursor-pointer hover:bg-white/70 dark:hover:bg-black/60 transition-colors shadow-sm">
                <div>
                  <strong className={cn("block mb-1 font-bold", maintenance ? "text-amber-600 dark:text-amber-400" : "")}>
                    {maintenance ? "⚠ وضع الصيانة مفعّل للزوار الآن" : "تفعيل وضع الصيانة للزوار"}
                  </strong>
                  <span className="text-xs opacity-70">الصفحة هتظهر بلوجو الموقع ورسالتك وموعد العودة والعداد التنازلي</span>
                </div>
                <div className="relative w-12 h-6 flex shrink-0">
                  <input type="checkbox" className="peer sr-only" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} />
                  <div className="absolute inset-0 rounded-full bg-slate-300 dark:bg-slate-700 peer-checked:bg-amber-500 transition-colors duration-300 shadow-inner"></div>
                  <div className={cn("absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md z-10 transition-all duration-300", maintenance ? "translate-x-[-24px]" : "")} />
                </div>
              </label>

              {/* Message */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold opacity-90">رسالة الزوار</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="glass-input resize-none py-3"
                  placeholder="بنجهز لكم تغطية إخبارية أفضل، سنعود قريباً."
                />
              </div>

              {/* Datetime */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold opacity-90 flex items-center gap-2">
                  <Clock3 size={15} />
                  موعد العودة (اليوم، التاريخ، الساعة)
                </label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="glass-input h-11 text-sm font-mono"
                  dir="ltr"
                />
                {endsAt && (
                  <p className="text-xs opacity-60">
                    سيُعرض عداد تنازلي للزوار حتى: {new Date(endsAt).toLocaleString("ar-EG")}
                  </p>
                )}
              </div>

              <button
                className={cn(
                  "glass-button h-12 w-full text-lg mt-2",
                  maintenance
                    ? "glass-button-primary !bg-amber-600 hover:!bg-amber-700 !border-amber-500/50 shadow-amber-500/20 shadow-lg"
                    : "glass-button-primary"
                )}
                type="submit"
              >
                <Save size={18} /> حفظ إعدادات الصيانة
              </button>
            </form>
          </section>

          {/* Live Preview */}
          <section className="glass-card p-6 md:p-8 self-start">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-glass-border/30">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h2 className="text-lg font-bold">معاينة مباشرة (Preview)</h2>
              <span className="text-xs opacity-50 mr-auto">كيف هيشوف الزوار الصفحة</span>
            </div>

            {/* Preview Box */}
            <div
              className="rounded-xl overflow-hidden border border-glass-border/40"
              style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}
            >
              <div className="flex flex-col items-center justify-center py-12 px-6 gap-5 text-center">
                {/* Logo placeholder */}
                <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                  <ShieldAlert size={28} className="text-teal-400" />
                </div>

                <div>
                  <h3 className="text-white text-xl font-bold mb-2">يحدث الآن 24</h3>
                  {maintenance ? (
                    <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-4">
                      <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                      وضع الصيانة مفعّل
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 mb-4">الموقع يعمل بشكل طبيعي</div>
                  )}
                  <p className="text-slate-300 text-sm leading-relaxed max-w-xs mx-auto">
                    {message || "بنجهز لكم تغطية إخبارية أفضل، سنعود قريباً."}
                  </p>
                </div>

                {/* Countdown simulation */}
                {endsAt && maintenance && (
                  <div className="flex items-center gap-3 mt-2">
                    {["يوم", "ساعة", "دقيقة", "ثانية"].map((unit, i) => (
                      <div key={unit} className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                          {["00", "00", "00", "00"][i]}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1">{unit}</span>
                      </div>
                    ))}
                  </div>
                )}

                {!maintenance && !endsAt && (
                  <p className="text-xs text-slate-600 border border-dashed border-slate-700 px-4 py-2 rounded-lg">
                    فعّل وضع الصيانة لترى شكل الصفحة
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* SOCIAL MEDIA TAB */}
      {activeTab === "social" && (
        <section className="glass-card p-6 md:p-8 max-w-2xl">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-glass-border/30">
            <div className="bg-primary/20 p-3 rounded-full text-primary">
              <Link2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">روابط السوشيال ميديا</h2>
              <p className="text-sm opacity-70 mt-1">الأيقونات تختفي تلقائياً من الموقع إذا كان الرابط فارغاً أو محذوفاً</p>
            </div>
          </div>

          <form onSubmit={saveSocial} className="flex flex-col gap-5">
            {socialIcons.map(({ key, label, icon: Icon, color, placeholder }) => (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-sm font-semibold opacity-90 flex items-center gap-2">
                  <span className={cn("p-1.5 rounded-lg", color)}><Icon size={16} /></span>
                  {label}
                  {!social[key] && <span className="text-xs bg-red-500/15 text-red-500 border border-red-500/30 px-2 py-0.5 rounded-full mr-auto">أيقونة مخفية من الموقع</span>}
                  {social[key] && <span className="text-xs bg-green-500/15 text-green-500 border border-green-500/30 px-2 py-0.5 rounded-full mr-auto flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>نشط بالموقع</span>}
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={social[key]}
                    onChange={(e) => setSocial(prev => ({ ...prev, [key]: e.target.value }))}
                    className="glass-input h-11 w-full pl-10"
                    placeholder={placeholder}
                    dir="ltr"
                  />
                  {social[key] && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <a href={social[key]} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-primary/20 text-primary transition-colors">
                        <ExternalLink size={14} />
                      </a>
                      <button type="button" onClick={() => setSocial(prev => ({ ...prev, [key]: "" }))} className="p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-4 rounded-xl text-sm flex items-start gap-3 mt-2">
              <span className="text-xl shrink-0 mt-0.5">💡</span>
              <div>
                <strong className="block mb-1">ملاحظة ذكية</strong>
                لو مسحت رابط أي منصة وحفظت الإعدادات، أيقونتها هتختفي أوتوماتيكياً من صفحة الصيانة وفوتر الموقع بالكامل دون أي تعديل في الكود.
              </div>
            </div>

            <button className="glass-button glass-button-primary h-12 w-full text-lg shadow-xl shadow-primary/20" type="submit">
              <Save size={18} /> حفظ روابط السوشيال ميديا
            </button>
          </form>
        </section>
      )}

      {/* CONTACT INFO TAB */}
      {activeTab === "contact" && (
        <section className="glass-card p-6 md:p-8 max-w-2xl">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-glass-border/30">
            <div className="bg-emerald-500/20 p-3 rounded-full text-emerald-500">
              <Phone size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">بيانات الاتصال</h2>
              <p className="text-sm opacity-70 mt-1">رقم الهاتف والعنوان ورقم الواتس - تظهر في صفحة التواصل والقائمة</p>
            </div>
          </div>

          <form onSubmit={saveContact} className="flex flex-col gap-5">
            {/* Phone */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold opacity-90 flex items-center gap-2">
                <span className="p-1.5 rounded-lg text-blue-500 bg-blue-500/10"><Phone size={16} /></span>
                رقم الهاتف
                {!contact.phone && <span className="text-xs bg-red-500/15 text-red-500 border border-red-500/30 px-2 py-0.5 rounded-full mr-auto">غير ظاهر بالموقع</span>}
                {contact.phone && <span className="text-xs bg-green-500/15 text-green-500 border border-green-500/30 px-2 py-0.5 rounded-full mr-auto flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>نشط بالموقع</span>}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContact(prev => ({ ...prev, phone: e.target.value }))}
                  className="glass-input h-11 w-full pl-10"
                  placeholder="مثال: +20123456789"
                  dir="ltr"
                />
                {contact.phone && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <a href={`tel:${contact.phone}`} className="p-1 rounded hover:bg-primary/20 text-primary transition-colors">
                      <Phone size={14} />
                    </a>
                    <button type="button" onClick={() => setContact(prev => ({ ...prev, phone: "" }))} className="p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold opacity-90 flex items-center gap-2">
                <span className="p-1.5 rounded-lg text-orange-500 bg-orange-500/10"><MapPin size={16} /></span>
                العنوان
                {!contact.address && <span className="text-xs bg-red-500/15 text-red-500 border border-red-500/30 px-2 py-0.5 rounded-full mr-auto">غير ظاهر بالموقع</span>}
                {contact.address && <span className="text-xs bg-green-500/15 text-green-500 border border-green-500/30 px-2 py-0.5 rounded-full mr-auto flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>نشط بالموقع</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={contact.address}
                  onChange={(e) => setContact(prev => ({ ...prev, address: e.target.value }))}
                  className="glass-input h-11 w-full pl-10"
                  placeholder="مثال: شارع النيل، أسوان، مصر"
                />
                {contact.address && (
                  <button type="button" onClick={() => setContact(prev => ({ ...prev, address: "" }))} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold opacity-90 flex items-center gap-2">
                <span className="p-1.5 rounded-lg text-green-600 bg-green-500/10"><MessageCircle size={16} /></span>
                رقم الواتس
                {!contact.whatsapp && <span className="text-xs bg-red-500/15 text-red-500 border border-red-500/30 px-2 py-0.5 rounded-full mr-auto">غير ظاهر بالموقع</span>}
                {contact.whatsapp && <span className="text-xs bg-green-500/15 text-green-500 border border-green-500/30 px-2 py-0.5 rounded-full mr-auto flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>نشط بالموقع</span>}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={contact.whatsapp}
                  onChange={(e) => setContact(prev => ({ ...prev, whatsapp: e.target.value }))}
                  className="glass-input h-11 w-full pl-10"
                  placeholder="مثال: +20123456789"
                  dir="ltr"
                />
                {contact.whatsapp && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <a href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-green-500/20 text-green-600 transition-colors">
                      <ExternalLink size={14} />
                    </a>
                    <button type="button" onClick={() => setContact(prev => ({ ...prev, whatsapp: "" }))} className="p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 p-4 rounded-xl text-sm flex items-start gap-3 mt-2">
              <span className="text-xl shrink-0 mt-0.5">ℹ️</span>
              <div>
                <strong className="block mb-1">معلومة مهمة</strong>
                البيانات اللي تضيفها هنا هتظهر تلقائياً في صفحة الاتصال والموقع. لو مسحت أي حقل وحفظت، المعلومة هتختفي أوتوماتيكياً.
              </div>
            </div>

            <button className="glass-button glass-button-primary h-12 w-full text-lg shadow-xl shadow-primary/20" type="submit">
              <Save size={18} /> حفظ بيانات الاتصال
            </button>
          </form>
        </section>
      )}

      {/* ACTIVITY LOG TAB */}
      {activeTab === "logs" && (
        <section className="glass-card p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-glass-border/30">
            <div className="bg-blue-500/20 p-3 rounded-full text-blue-500">
              <History size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">سجل النشاطات</h2>
              <p className="text-sm opacity-70 mt-1">آخر {logs.length} حركة وتعديل تم تسجيلها داخل لوحة التحكم</p>
            </div>
          </div>
          
          {logs.length === 0 ? (
            <div className="py-20 grid place-items-center opacity-50 text-center">
              <AlertTriangle size={40} className="mb-3 opacity-60" />
              <strong>لا توجد نشاطات مسجلة حتى الآن</strong>
              <span className="text-sm mt-1">ستظهر هنا جميع التعديلات اللي يعملها الفريق</span>
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border border-glass-border/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/50 dark:bg-black/40 border-b border-glass-border/40">
                    <th className="text-right px-4 py-3 font-bold opacity-70 whitespace-nowrap">#</th>
                    <th className="text-right px-4 py-3 font-bold opacity-70 whitespace-nowrap">الموظف</th>
                    <th className="text-right px-4 py-3 font-bold opacity-70 whitespace-nowrap">الإجراء</th>
                    <th className="text-right px-4 py-3 font-bold opacity-70 whitespace-nowrap">القسم</th>
                    <th className="text-right px-4 py-3 font-bold opacity-70 whitespace-nowrap">التاريخ والوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border/20">
                  {logs.map((log, index) => {
                    const actionKey = log.action?.toLowerCase().split(" ")[0] ?? "";
                    const colorClass = actionColors[actionKey] ?? "bg-slate-500/15 text-slate-600 border-slate-500/30";
                    const actionLabel = actionLabels[actionKey] ?? log.action;
                    return (
                      <tr key={log.id} className="hover:bg-white/30 dark:hover:bg-black/20 transition-colors">
                        <td className="px-4 py-3 opacity-40 font-mono text-xs">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                              {log.actor?.[0]?.full_name?.charAt(0) ?? "س"}
                            </div>
                            <span className="font-semibold">{log.actor?.[0]?.full_name ?? "النظام"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border", colorClass)}>
                            {actionLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-white/60 dark:bg-black/40 px-2.5 py-1 rounded-full text-xs border border-glass-border/30 font-mono uppercase tracking-wide">
                            {log.entity_type ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <time dateTime={log.created_at} className="flex items-center gap-1.5 opacity-70 font-mono text-xs">
                            <Clock3 size={12} className="shrink-0" />
                            {new Date(log.created_at).toLocaleString("ar-EG")}
                          </time>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
