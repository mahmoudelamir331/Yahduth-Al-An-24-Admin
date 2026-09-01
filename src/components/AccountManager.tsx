"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, KeyRound, Save, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

type Props = { profile: { id: string; full_name: string; role: string }; email: string };

export default function AccountManager({ profile, email }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") || "").trim();
    const nextEmail = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    if (!fullName || !nextEmail) { setNotice("اكتب الاسم والبريد الإلكتروني."); return; }
    if (password && password.length < 8) { setNotice("كلمة المرور لازم تكون 8 حروف على الأقل."); return; }
    setSaving(true); setNotice("جارٍ حفظ بيانات حسابك...");
    const profileResult = await supabase.from("profiles").update({ full_name: fullName }).eq("id", profile.id);
    if (profileResult.error) { setSaving(false); setNotice("تعذر تحديث الاسم: " + profileResult.error.message); return; }
    const authResult = await supabase.auth.updateUser({ email: nextEmail, ...(password ? { password } : {}) });
    setSaving(false);
    if (authResult.error) { setNotice("تم تحديث الاسم، لكن تعذر تحديث بيانات الدخول: " + authResult.error.message); return; }
    setNotice(nextEmail !== email ? "تم الحفظ. راجع بريدك لتأكيد البريد الجديد إذا طلب Supabase ذلك ✓" : "تم تحديث حسابك بنجاح ✓");
  }

  return <div className="space-y-6" dir="rtl">
    <div><p className="text-primary font-bold text-sm mb-1">الخصوصية والحساب</p><h1 className="text-3xl font-bold">حسابي</h1><p className="text-sm opacity-70 mt-2">البيانات دي خاصة بحسابك ومش بتظهر لأي مستخدم تاني.</p></div>
    <form onSubmit={save} className="glass-card p-6 max-w-2xl space-y-5">
      <div className="flex items-center gap-3"><div className="rounded-xl bg-primary/15 p-3 text-primary"><UserRound size={22}/></div><div><h2 className="font-bold">بياناتي الشخصية</h2><p className="text-xs opacity-70">الدور الحالي: {profile.role === "super_admin" ? "المالك" : profile.role}</p></div></div>
      <label className="block space-y-2"><span className="text-sm font-bold">الاسم بالكامل</span><input name="fullName" className="glass-input" defaultValue={profile.full_name} autoComplete="name" required /></label>
      <label className="block space-y-2"><span className="text-sm font-bold">البريد الإلكتروني</span><input name="email" type="email" dir="ltr" className="glass-input" defaultValue={email} autoComplete="email" required /></label>
      <label className="block space-y-2"><span className="text-sm font-bold flex items-center gap-2"><KeyRound size={16}/> كلمة مرور جديدة <small className="opacity-60">(اختياري)</small></span><input name="password" type="password" dir="ltr" className="glass-input" minLength={8} placeholder="اتركها فارغة بدون تغيير" autoComplete="new-password" /></label>
      <button className="glass-button glass-button-primary" type="submit" disabled={saving}><Save size={17}/> {saving ? "جارٍ الحفظ..." : "حفظ بياناتي"}</button>
      {notice && <p className="flex items-center gap-2 text-sm font-semibold text-primary"><CheckCircle2 size={17}/>{notice}</p>}
    </form>
  </div>;
}
