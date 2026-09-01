"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { Plus, Save, Trash2, Edit3, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

type Journalist = { 
  id: string; 
  display_name: string; 
  email?: string;
  bio?: string;
  is_active: boolean;
};

export default function JournalistManager() {
  const supabase = useMemo(() => createClient(), []);
  const [journalists, setJournalists] = useState<Journalist[]>([]);
  const [editing, setEditing] = useState<Journalist | null>(null);
  const [newJournalist, setNewJournalist] = useState({ display_name: "", email: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  // تحميل الصحفيين
  const loadJournalists = async () => {
    try {
      const { data, error } = await supabase
        .from("journalists")
        .select("id,display_name,email,bio,is_active")
        .order("created_at", { ascending: false });
      
      if (error) {
        setNotice("خطأ في تحميل الصحفيين: " + error.message);
        return;
      }
      setJournalists(data || []);
    } catch (err) {
      setNotice("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadJournalists();
  }, [supabase]);

  // إضافة صحفي جديد
  const handleAddJournalist = async (e: FormEvent) => {
    e.preventDefault();
    if (!newJournalist.display_name.trim()) {
      setNotice("الاسم مطلوب");
      return;
    }

    try {
      const { error } = await supabase.from("journalists").insert({
        display_name: newJournalist.display_name,
        email: newJournalist.email || null,
        bio: newJournalist.bio || null,
        is_active: true,
      });

      if (error) {
        setNotice("خطأ: " + error.message);
        return;
      }

      setNotice("تم إضافة الصحفي بنجاح ✓");
      setNewJournalist({ display_name: "", email: "", bio: "" });
      await loadJournalists();
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setNotice("حدث خطأ غير متوقع");
    }
  };

  // تحديث صحفي
  const handleUpdateJournalist = async () => {
    if (!editing || !editing.display_name.trim()) {
      setNotice("الاسم مطلوب");
      return;
    }

    try {
      const { error } = await supabase
        .from("journalists")
        .update({
          display_name: editing.display_name,
          email: editing.email || null,
          bio: editing.bio || null,
        })
        .eq("id", editing.id);

      if (error) {
        setNotice("خطأ: " + error.message);
        return;
      }

      setNotice("تم التحديث بنجاح ✓");
      setEditing(null);
      await loadJournalists();
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setNotice("حدث خطأ غير متوقع");
    }
  };

  // حذف صحفي
  const handleDeleteJournalist = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الصحفي؟")) return;

    try {
      const { error } = await supabase
        .from("journalists")
        .delete()
        .eq("id", id);

      if (error) {
        setNotice("خطأ: " + error.message);
        return;
      }

      setNotice("تم الحذف بنجاح ✓");
      await loadJournalists();
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setNotice("حدث خطأ غير متوقع");
    }
  };

  // تفعيل/إيقاف صحفي
  const handleToggleActive = async (journalist: Journalist) => {
    try {
      const { error } = await supabase
        .from("journalists")
        .update({ is_active: !journalist.is_active })
        .eq("id", journalist.id);

      if (error) {
        setNotice("خطأ: " + error.message);
        return;
      }

      setNotice(journalist.is_active ? "تم إيقاف الصحفي" : "تم تفعيل الصحفي");
      await loadJournalists();
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setNotice("حدث خطأ غير متوقع");
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-foreground/60">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رسالة التنبيه */}
      {notice && (
        <div className={cn(
          "p-4 rounded-xl border font-bold text-sm",
          notice.includes("✓") ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-amber-500/10 text-amber-600 border-amber-500/30"
        )}>
          {notice}
        </div>
      )}

      {/* نموذج إضافة صحفي جديد */}
      <div className="bg-background border border-foreground/10 rounded-3xl p-6 space-y-4">
        <h3 className="text-lg font-black text-foreground">إضافة صحفي جديد</h3>
        <form onSubmit={handleAddJournalist} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground/70 block mb-1">
                اسم الصحفي أو المراسل *
              </label>
              <input
                type="text"
                value={newJournalist.display_name}
                onChange={(e) => setNewJournalist({ ...newJournalist, display_name: e.target.value })}
                placeholder="مثال: محمد الأمين"
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground/70 block mb-1">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={newJournalist.email}
                onChange={(e) => setNewJournalist({ ...newJournalist, email: e.target.value })}
                placeholder="البريد الإلكتروني (اختياري)"
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground/70 block mb-1">
              النبذة الشخصية
            </label>
            <textarea
              value={newJournalist.bio}
              onChange={(e) => setNewJournalist({ ...newJournalist, bio: e.target.value })}
              placeholder="وصف مختصر عن الصحفي (اختياري)"
              rows={2}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-black text-sm py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة الصحفي
          </button>
        </form>
      </div>

      {/* قائمة الصحفيين */}
      <div className="space-y-3">
        <h3 className="text-lg font-black text-foreground">الصحفيون والمراسلون ({journalists.length})</h3>
        
        {journalists.length === 0 ? (
          <div className="bg-background border border-foreground/10 rounded-3xl p-6 text-center">
            <p className="text-foreground/60 font-bold">لا توجد صحفيين بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {journalists.map((journalist) => (
              <div
                key={journalist.id}
                className="bg-background border border-foreground/10 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  {editing?.id === journalist.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editing.display_name}
                        onChange={(e) => setEditing({ ...editing, display_name: e.target.value })}
                        className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-3 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <textarea
                        value={editing.bio || ""}
                        onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
                        placeholder="النبذة الشخصية"
                        rows={2}
                        className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-3 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-black text-foreground flex items-center gap-2">
                        {journalist.display_name}
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold",
                          journalist.is_active 
                            ? "bg-green-500/20 text-green-600" 
                            : "bg-red-500/20 text-red-600"
                        )}>
                          {journalist.is_active ? "نشط" : "موقوف"}
                        </span>
                      </h4>
                      {journalist.email && (
                        <p className="text-xs text-foreground/60 font-bold">{journalist.email}</p>
                      )}
                      {journalist.bio && (
                        <p className="text-xs text-foreground/70 mt-1">{journalist.bio}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {editing?.id === journalist.id ? (
                    <>
                      <button
                        onClick={handleUpdateJournalist}
                        className="p-2 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                        title="حفظ"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                        title="إلغاء"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditing(journalist)}
                        className="p-2 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                        title="تعديل"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(journalist)}
                        className={cn(
                          "p-2 rounded-xl font-bold text-sm transition-colors",
                          journalist.is_active
                            ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                            : "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                        )}
                        title={journalist.is_active ? "إيقاف" : "تفعيل"}
                      >
                        {journalist.is_active ? "إيقاف" : "تفعيل"}
                      </button>
                      <button
                        onClick={() => handleDeleteJournalist(journalist.id)}
                        className="p-2 rounded-xl bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
