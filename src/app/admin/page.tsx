"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { createClient, hasSupabaseConfig } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

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
      setMessage("إعدادات الخادم ناقصة: أضف NEXT_PUBLIC_SUPABASE_URL وNEXT_PUBLIC_SUPABASE_ANON_KEY في Vercel ثم أعد النشر.");
      return;
    }
    setIsLoading(true);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (error) {
      setMessage(
        error.message === "Invalid login credentials"
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
          : `تعذر تسجيل الدخول: ${error.message}`
      );
      return;
    }
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex relative overflow-hidden" dir="rtl">

      {/* ───── Left decorative panel (hidden on mobile) ───── */}
      <div
        className="hidden lg:flex flex-col items-center justify-center w-[45%] relative p-12 shrink-0"
        style={{
          background: "linear-gradient(145deg, #0d9488 0%, #0f766e 40%, #134e4a 100%)",
        }}
      >
        {/* grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-teal-300/20 blur-2xl" />

        {/* Content */}
        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="mb-10 inline-block">
            <div className="bg-white/20 backdrop-blur-md border border-white/25 rounded-2xl p-4 shadow-2xl">
              <Image
                src="/logo.jpg"
                alt="شعار يحدث الآن 24"
                width={160}
                height={60}
                className="object-contain"
                priority
              />
            </div>
          </div>

          <h2 className="text-white text-3xl font-bold mb-3 leading-snug">
            بوابة الإدارة المركزية
          </h2>
          <p className="text-teal-100/80 text-base leading-relaxed max-w-[280px] mx-auto">
            منصة إدارة متكاملة لفريق تحرير "يحدث الآن 24" — إدارة الأخبار، الميديا، والإعلانات في مكان واحد.
          </p>


        </div>
      </div>

      {/* ───── Right: Login Form ───── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md">

          {/* Mobile-only logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Image
              src="/logo.jpg"
              alt="شعار يحدث الآن 24"
              width={140}
              height={52}
              className="object-contain"
              priority
            />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="text-teal-600 dark:text-teal-400 text-sm font-bold mb-1 flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-teal-500 rounded-full inline-block" />
              يحدث الآن 24
            </p>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white leading-tight">
              تسجيل الدخول
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              سجّل الدخول بحساب الإدارة المصرّح به
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-xl shadow-slate-200/60 dark:shadow-black/30">
            <form onSubmit={handleLogin} noValidate className="flex flex-col gap-5">

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  البريد الإلكتروني (أو رقم الموظف)
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@yahduthalaan.com"
                    dir="ltr"
                    className={cn(
                      "w-full h-12 pr-10 pl-4 rounded-xl text-sm border outline-none transition-all duration-200",
                      "bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white",
                      "border-slate-200 dark:border-slate-600",
                      "focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20",
                      "placeholder:text-slate-400"
                    )}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  كلمة المرور
                </label>
                <div className="relative">
                  <LockKeyhole size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    dir="ltr"
                    className={cn(
                      "w-full h-12 pr-10 pl-10 rounded-xl text-sm border outline-none transition-all duration-200",
                      "bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white",
                      "border-slate-200 dark:border-slate-600",
                      "focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20",
                      "placeholder:text-slate-400"
                    )}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "إخفاء" : "إظهار"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {message && (
                <div
                  className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2"
                  role="status"
                >
                  <span className="shrink-0">⚠</span>
                  {message}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full h-12 mt-1 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300",
                  "bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/25",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />جارٍ التحقق...</>
                ) : (
                  "دخول اللوحة ←"
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            لإعادة تعيين كلمة المرور، تواصل مع مدير النظام
          </p>
        </div>
      </div>
    </main>
  );
}
