"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const subscription = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || Boolean(session)) setReady(true);
    }).data.subscription;
    void supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    return () => subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 12) return setError("كلمة المرور لازم تكون 12 حرف على الأقل.");
    if (password !== confirmation) return setError("كلمتا المرور غير متطابقتين.");
    setBusy(true);
    const result = await createClient().auth.updateUser({ password });
    if (result.error) setError("الرابط غير صالح أو انتهت صلاحيته. اطلب رابط استعادة جديد.");
    else setMessage("تم تعيين كلمة المرور الجديدة. تقدر تسجل دخولك دلوقتي.");
    setBusy(false);
  }

  return <main className="mx-auto flex min-h-screen max-w-md items-center p-6" dir="rtl"><section className="w-full rounded-xl border bg-card p-6 shadow-sm"><h1 className="text-2xl font-black">تعيين كلمة مرور جديدة</h1><p className="mt-2 text-sm text-muted-foreground">استخدم الرابط اللي وصلك على بريدك. الرابط صالح لمرة واحدة فقط.</p>{!ready && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">الرابط غير صالح أو انتهت صلاحيته.</p>}{ready && <form className="mt-5 space-y-4" onSubmit={submit}><label className="block text-sm font-semibold">كلمة المرور الجديدة<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="admin-input mt-1.5" minLength={12} required /></label><label className="block text-sm font-semibold">تأكيد كلمة المرور<input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="admin-input mt-1.5" minLength={12} required /></label>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}{message && <p role="status" className="text-sm text-emerald-700">{message}</p>}<button disabled={busy} className="interactive-button w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">{busy ? "جاري الحفظ..." : "حفظ كلمة المرور"}</button></form>}<Link href="/login" className="mt-5 block text-center text-sm font-semibold text-primary">العودة لتسجيل الدخول</Link></section></main>;
}
