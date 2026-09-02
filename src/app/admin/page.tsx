"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { createClient, hasSupabaseConfig } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

const LOGIN_TIMEOUT_MS = 15000;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!hasSupabaseConfig()) {
      setMessage("إعدادات الخادم ناقصة. راجع متغيرات Supabase في البيئة.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await Promise.race([
        createClient().auth.signInWithPassword({ email: email.trim(), password }),
        new Promise<{ error: { message: string } }>((resolve) => {
          window.setTimeout(() => resolve({ error: { message: "انتهى وقت الاتصال بالخادم. حاول مرة أخرى." } }), LOGIN_TIMEOUT_MS);
        }),
      ]);
      if (result.error) {
        setMessage(result.error.message === "Invalid login credentials" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة." : `تعذر تسجيل الدخول: ${result.error.message}`);
        return;
      }
      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setMessage("تعذر الاتصال بالخادم. تأكد من تشغيل Supabase ثم حاول مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 lg:grid lg:grid-cols-2" dir="rtl">
      <section className="relative isolate flex min-h-[360px] items-center justify-center overflow-hidden bg-[#082f49] px-6 py-14 text-center text-white lg:min-h-screen lg:px-12">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-amber-300/15 blur-3xl" />
        <div className="relative z-10 flex w-full max-w-2xl flex-col items-center">
          <div className="mb-10 w-full max-w-[560px] rounded-[2rem] border border-white/25 bg-white/10 p-5 shadow-2xl backdrop-blur-md sm:p-7"><div className="relative aspect-[1408/768] w-full overflow-hidden rounded-2xl bg-[#061d38] shadow-inner"><Image src="/brand-logo.jpg" alt="شعار يحدث الآن 24" fill priority sizes="(max-width: 1024px) 90vw, 560px" className="object-contain" /></div></div>
          <div className="max-w-xl space-y-5"><div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100"><ShieldCheck size={17} /> مساحة عمل آمنة لفريق التحرير</div><h1 className="text-4xl font-black leading-tight sm:text-5xl">بوابة الإدارة المركزية</h1><p className="mx-auto max-w-lg text-base leading-8 text-cyan-50/75 sm:text-lg">منصة متكاملة لإدارة الأخبار والميديا والإعلانات والأقسام، في تجربة واحدة واضحة وراقية.</p></div>
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-8 lg:px-14 xl:px-24"><div className="w-full max-w-xl"><div className="mb-8 space-y-3"><p className="flex items-center gap-2 text-sm font-bold text-cyan-700 dark:text-cyan-400"><span className="h-1 w-8 rounded-full bg-cyan-600" /> يحدث الآن 24</p><h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">تسجيل الدخول</h2><p className="text-base text-slate-500 dark:text-slate-400">سجّل دخولك بحساب الإدارة المصرّح به.</p></div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-30px_rgba(15,23,42,.35)] sm:p-10 dark:border-slate-800 dark:bg-slate-900"><form onSubmit={handleLogin} noValidate className="flex flex-col gap-6"><label className="flex flex-col gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">البريد الإلكتروني<div className="relative"><Mail size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" /><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="admin@yahduthalaan.com" dir="ltr" className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 text-base font-medium outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></div></label><label className="flex flex-col gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">كلمة المرور<div className="relative"><LockKeyhole size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" /><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="••••••••" dir="ltr" className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 pl-12 text-base font-medium outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /><button type="button" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} onClick={() => setShowPassword((value) => !value)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>{message && <div role="status" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{message}</div>}<button type="submit" disabled={isLoading} className={cn("mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-700 text-base font-black text-white shadow-lg shadow-cyan-700/20 transition hover:bg-cyan-600", "disabled:cursor-not-allowed disabled:opacity-60")}>{isLoading ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> جارٍ التحقق...</> : <>دخول لوحة التحكم <ArrowLeft size={18} /></>}</button></form></div><p className="mt-6 text-center text-sm text-slate-400">لاستعادة كلمة المرور، تواصل مع مدير النظام.</p></div></section>
    <ForgotPasswordForm />
    </main>
  );
}

function ForgotPasswordForm() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/password-reset-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("resetName"), email: form.get("resetEmail"), password: form.get("resetPassword") }) });
      const result = await response.json(); setMessage(result.message ?? "تعذر إرسال الطلب.");
      if (response.ok) event.currentTarget.reset();
    } catch { setMessage("تعذر الاتصال بالخادم."); } finally { setBusy(false); }
  }
  return <div className="fixed bottom-5 left-5 z-30 w-[min(92vw,380px)] text-center"><button type="button" onClick={() => setOpen((value) => !value)} className="rounded-full bg-cyan-700 px-5 py-3 text-sm font-bold text-white shadow-xl">نسيت كلمة السر للموظف؟</button>{open && <div className="mt-3 rounded-2xl border border-cyan-100 bg-white p-5 text-right shadow-2xl dark:border-cyan-900 dark:bg-slate-900"><h3 className="mb-1 text-lg font-bold">طلب كلمة سر جديدة</h3><p className="mb-4 text-xs leading-6 text-slate-500">لن تتغير كلمة السر إلا بعد موافقة الإدارة.</p><form onSubmit={submit} className="grid gap-3"><input name="resetName" required placeholder="اسم الموظف" className="h-11 rounded-xl border px-3 dark:bg-slate-950" /><input name="resetEmail" required type="email" placeholder="البريد الإلكتروني" dir="ltr" className="h-11 rounded-xl border px-3 dark:bg-slate-950" /><input name="resetPassword" required minLength={8} type="password" placeholder="كلمة السر الجديدة" dir="ltr" className="h-11 rounded-xl border px-3 dark:bg-slate-950" /><button disabled={busy} className="h-11 rounded-xl bg-cyan-700 font-bold text-white disabled:opacity-60">{busy ? "جارٍ الإرسال..." : "إرسال طلب المراجعة"}</button>{message && <p role="status" className="text-sm font-semibold text-cyan-700">{message}</p>}</form></div>}</div>;
}
