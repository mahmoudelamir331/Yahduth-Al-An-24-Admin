"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setInfo(""); setBusy(true);
    try {
      const response = await fetch("/api/password-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase() }) });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) setError(result.error ?? "تعذر إرسال الطلب، حاول تاني");
      else setInfo(result.message ?? "تم استلام الطلب. لو البيانات صحيحة، هيراجعه المدير العام.");
    } catch { setError("تعذر إرسال الطلب، حاول تاني"); }
    setBusy(false);
  }

  return <main className="grid min-h-screen place-items-center bg-background p-4"><form onSubmit={submit} className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm"><div className="mx-auto mb-5 grid size-12 place-items-center rounded-xl bg-primary text-xl font-black text-primary-foreground">ي</div><h1 className="text-center text-2xl font-black">نسيت كلمة المرور</h1><p className="mb-6 mt-2 text-center text-sm text-muted-foreground">اكتب بريدك، والإدارة هتراجع الطلب وتحدد لك كلمة مرور جديدة بشكل آمن.</p><label className="block text-sm font-semibold">البريد الإلكتروني<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="admin-input mt-1.5" autoComplete="email" /></label>{error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}{info && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">{info}</p>}<button disabled={busy} className="interactive-button mt-6 flex w-full items-center justify-center rounded-lg bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">{busy ? "جاري الإرسال..." : "تقديم الطلب"}</button><Link href="/login" className="mt-4 block text-center text-sm text-primary hover:underline">العودة لتسجيل الدخول</Link></form></main>;
}
