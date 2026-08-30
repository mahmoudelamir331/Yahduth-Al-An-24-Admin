"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

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
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setMessage("أضف مفتاح Supabase العام في ملف البيئة قبل تسجيل الدخول.");
      return;
    }
    setIsLoading(true);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (error) {
      setMessage("تعذر تسجيل الدخول. راجع البريد الإلكتروني وكلمة المرور.");
      return;
    }
    router.push("/admin/dashboard");
    router.refresh();
  }

  return <main className="login-page"><section className="login-panel" aria-labelledby="login-title">
    <div className="brand-logo"><Image src="/logo.jpg" alt="شعار يحدث الآن" width={170} height={70} priority /></div>
    <p className="eyebrow">لوحة التحكم</p><h1 id="login-title">تسجيل الدخول</h1>
    <p className="subtitle">دخول آمن لفريق التحرير والإدارة</p>
    <form onSubmit={handleLogin} noValidate>
      <label htmlFor="email">البريد الإلكتروني</label>
      <div className="input-wrap"><Mail aria-hidden="true" size={18} /><input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <label htmlFor="password">كلمة المرور</label>
      <div className="input-wrap"><LockKeyhole aria-hidden="true" size={18} /><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /><button className="icon-button" type="button" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
      <button className="submit" type="submit" disabled={isLoading}>{isLoading ? "جارٍ التحقق..." : "تسجيل الدخول"}</button>
      {message && <p className="message" role="status">{message}</p>}
    </form>
    <p className="help-text">طلبات تغيير كلمة المرور تظهر للمدير للمراجعة والموافقة.</p>
  </section></main>;
}
