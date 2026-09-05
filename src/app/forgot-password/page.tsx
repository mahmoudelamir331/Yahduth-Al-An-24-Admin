"use client";

import { ArrowRight, LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import styles from "../login/login.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);

    try {
      const response = await fetch("/api/password-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setError(result.error ?? "تعذر إرسال الطلب، حاول تاني");
      } else {
        setInfo(result.message ?? "تم استلام الطلب. لو البيانات صحيحة، هيراجعه المدير العام.");
      }
    } catch {
      setError("تعذر إرسال الطلب، حاول تاني");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.shell} dir="rtl">
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.layout}>
        <section className={styles.story} aria-labelledby="brand-name">
          <div className={styles.eyebrow}>
            <span /> استعادة الحساب
          </div>
          <p id="brand-name" className={styles.brand}>
            يحدث الآن<span className={styles.brandDot}>.</span>
          </p>
          <div className={styles.storyCopy}>
            <p className={styles.kicker}>أمان حسابك أولويتنا</p>
            <h2>
              استرجع وصولك
              <br />
              <span>إلى غرفة الأخبار.</span>
            </h2>
            <p className={styles.description}>
              اكتب بريدك المسجل، والإدارة هتراجع طلبك
              <br />
              وهتزودك بكلمة مرور جديدة بأعلى معايير الأمان.
            </p>
          </div>
          <div className={styles.wave} aria-hidden="true">
            {Array.from({ length: 24 }, (_, index) => (
              <span key={index} style={{ animationDelay: `${index * -0.13}s` }} />
            ))}
          </div>
          <p className={styles.storyFooter}>
            <span /> غرفة الأخبار الرقمية <span className={styles.footerLine} /> حماية وتأمين الحسابات
          </p>
        </section>

        <section className={styles.panel} aria-labelledby="forgot-title">
          <div className={styles.panelTop}>
            <span>إدارة الحساب</span>
            <span className={styles.accessBadge}>
              <ShieldCheck size={14} aria-hidden="true" /> طلب آمن
            </span>
          </div>

          <form onSubmit={submit} className={styles.form} aria-busy={busy}>
            <p className={styles.welcome}>الدعم الفني للفريق</p>
            <h1 id="forgot-title">نسيت كلمة المرور</h1>
            <p className={styles.subtitle}>
              اكتب بريدك المسجل، وهيتم مراجعة الطلب مباشرة من الإدارة.
            </p>

            <label className={styles.label} htmlFor="email">
              البريد الإلكتروني المسجل
            </label>
            <div className={styles.inputWrap}>
              <Mail size={19} aria-hidden="true" />
              <input
                id="email"
                required
                type="email"
                dir="ltr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="name@example.com"
              />
            </div>

            {error && <p role="alert" className={styles.error}>{error}</p>}
            {info && (
              <p
                role="status"
                style={{
                  border: "1px solid #b7eb8f",
                  borderRadius: ".65rem",
                  padding: ".85rem",
                  marginTop: "1rem",
                  color: "#135200",
                  background: "#f6ffed",
                  fontSize: ".88rem",
                  lineHeight: 1.8,
                }}
              >
                {info}
              </p>
            )}

            <button type="submit" disabled={busy} className={styles.submit}>
              <span>{busy ? "جاري الإرسال..." : "تقديم طلب الاستعادة"}</span>
              {busy ? (
                <LoaderCircle className={styles.spinner} size={20} aria-hidden="true" />
              ) : (
                <ArrowRight size={20} aria-hidden="true" />
              )}
            </button>

            <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
              <Link href="/login" className={styles.forgot}>
                العودة لتسجيل الدخول
              </Link>
            </div>
          </form>

          <div className={styles.panelFooter}>
            <span>يحدث الآن</span>
            <span>بوابة الأمان والتحكم</span>
          </div>
        </section>
      </div>
    </main>
  );
}

