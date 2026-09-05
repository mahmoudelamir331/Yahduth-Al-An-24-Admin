"use client";

import { Check, KeyRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type ResetRequest = { id: string; email: string; status: string; rejection_reason: string | null; created_at: string };

const statusLabels: Record<string, string> = { pending: "معلق", approved: "معتمد", rejected: "مرفوض" };
const statusTones: Record<string, string> = { pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300", approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300", rejected: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300" };

export function PasswordRequestsClient({ requests }: { requests: ResetRequest[] }) {
  const router = useRouter();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function decide(id: string, action: "approve" | "reject", extra: { password?: string; reason?: string } = {}) {
    setBusyId(id); setError(""); setMessage("");
    const response = await fetch("/api/password-requests/decide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, ...extra }) });
    const result = await response.json() as { message?: string; error?: string };
    if (!response.ok) setError(result.error ?? "حدث خطأ");
    else { setMessage(result.message ?? "تم"); setApprovingId(null); setRejectingId(null); setPassword(""); router.refresh(); }
    setBusyId(null);
  }

  return <main className="min-h-screen flex-1 bg-background p-4 text-foreground sm:p-8"><div className="mx-auto max-w-5xl"><p className="text-sm font-semibold text-primary">للمدير العام فقط</p><h1 className="mt-1 text-2xl font-black">طلبات استعادة كلمة المرور</h1><p className="mt-2 text-sm text-muted-foreground">كلمة المرور لا تُحفظ مع الطلب؛ حدد كلمة آمنة عند الموافقة وسلّمها للموظف بطريقة آمنة.</p>{message && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</p>}{error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}<div className="mt-6 space-y-4">{requests.length === 0 && <section className="rounded-xl border bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">مفيش طلبات حاليًا.</p></section>}{requests.map((request) => <section key={request.id} className="rounded-xl border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-accent text-primary"><KeyRound size={19} /></span><div><p className="font-bold" dir="ltr">{request.email}</p><p className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleString("ar-EG")}</p></div></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTones[request.status] ?? ""}`}>{statusLabels[request.status] ?? request.status}</span></div>{request.status === "rejected" && request.rejection_reason && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">سبب الرفض: {request.rejection_reason}</p>}{request.status === "pending" && <div className="mt-4 flex flex-wrap gap-2">{approvingId === request.id ? <div className="flex w-full flex-wrap items-center gap-2"><input dir="ltr" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="كلمة السر الجديدة (8 حروف على الأقل)" className="admin-input flex-1" autoComplete="new-password" /><button disabled={busyId === request.id} onClick={() => decide(request.id, "approve", { password })} className="interactive-button flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"><Check size={15} />موافقة</button><button onClick={() => { setApprovingId(null); setPassword(""); }} className="interactive-button rounded-lg border px-3 py-2 text-xs font-bold text-muted-foreground">إلغاء</button></div> : rejectingId === request.id ? <div className="flex w-full flex-wrap items-center gap-2"><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="سبب الرفض (هيظهر للموظف عند التواصل مع الإدارة)" className="admin-input flex-1" /><button disabled={busyId === request.id} onClick={() => decide(request.id, "reject", { reason })} className="interactive-button flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"><X size={15} />تأكيد الرفض</button><button onClick={() => setRejectingId(null)} className="interactive-button rounded-lg border px-3 py-2 text-xs font-bold text-muted-foreground">إلغاء</button></div> : <><button disabled={busyId === request.id} onClick={() => { setApprovingId(request.id); setPassword(""); }} className="interactive-button flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"><Check size={15} />تحديد كلمة مرور والموافقة</button><button onClick={() => { setRejectingId(request.id); setReason(""); }} className="interactive-button flex items-center gap-1.5 rounded-lg border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"><X size={15} />رفض</button></>}</div>}</section>)}</div></div></main>;
}
