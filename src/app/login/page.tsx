"use client";

import { ArrowLeft, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const { error: signInError } = await createClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message === "Invalid login credentials" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : `تعذر تسجيل الدخول: ${signInError.message}`);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بخدمة تسجيل الدخول. راجع إعدادات Supabase وحاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.shell} dir="rtl">
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.layout}>
        <section className={styles.story} aria-labelledby="brand-name">
          <div className={styles.eyebrow}><span /> منصة الأخبار والمحتوى</div>
          <p id="brand-name" className={styles.brand}>يحدث الآن<span className={styles.brandDot}>.</span></p>
          <div className={styles.storyCopy}>
            <p className={styles.kicker}>خلف كل خبر، أنت.</p>
            <h2>من هنا تبدأ<br /><span>الحكاية القادمة.</span></h2>
            <p className={styles.description}>مساحتك لصناعة الخبر وإدارة المحتوى.<br />كل الأدوات بين إيديك، والتأثير يبدأ بكلمة.</p>
          </div>
          <div className={styles.wave} aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <span key={index} style={{ animationDelay: `${index * -0.13}s` }} />)}</div>
          <p className={styles.storyFooter}><span /> غرفة الأخبار الرقمية <span className={styles.footerLine} /> صوت الحدث. لحظة بلحظة.</p>
        </section>
        <section className={styles.panel} aria-labelledby="login-title">
          <div className={styles.panelTop}><span>لوحة التحكم</span><span className={styles.accessBadge}><ShieldCheck size={14} aria-hidden="true" /> دخول الفريق</span></div>
          <form onSubmit={submit} className={styles.form} aria-busy={busy}>
            <p className={styles.welcome}>أهلًا برجوعك</p>
            <h1 id="login-title">تسجيل الدخول</h1>
            <p className={styles.subtitle}>خبر جديد مستنيك. سجّل دخولك وابدأ.</p>
            <label className={styles.label} htmlFor="email">البريد الإلكتروني</label>
            <div className={styles.inputWrap}>
              <Mail size={19} aria-hidden="true" />
              <input id="email" required type="email" dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="name@example.com" />
            </div>
            <div className={styles.passwordHeading}>
              <label className={styles.label} htmlFor="password">كلمة المرور</label>
              <Link href="/forgot-password" className={styles.forgot}>نسيت كلمة المرور؟</Link>
            </div>
            <div className={styles.inputWrap}>
              <LockKeyhole size={19} aria-hidden="true" />
              <input id="password" required type="password" dir="ltr" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="••" />
            </div>
            {error && <p role="alert" className={styles.error}>{error}</p>}
            <button type="submit" disabled={busy} className={styles.submit}>
              <span>{busy ? "جاري الدخول..." : "دخول لوحة التحكم"}</span>
              {busy ? <LoaderCircle className={styles.spinner} size={20} aria-hidden="true" /> : <ArrowLeft size={20} aria-hidden="true" />}
            </button>
            <p className={styles.formNote}><ShieldCheck size={16} aria-hidden="true" /> مساحة مخصصة لفريق يحدث الآن</p>
          </form>
          <div className={styles.panelFooter}><span>يحدث الآن</span><span>المحتوى يبدأ من هنا</span></div>
        </section>
      </div>
    </main>
  );
}
