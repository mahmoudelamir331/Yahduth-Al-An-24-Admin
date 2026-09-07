"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ArticleActions({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function changeStatus(next: "published" | "draft" | "review") {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/articles/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) alert(result.error ?? "تعذر تغيير حالة الخبر");
      else router.refresh();
    } catch (reason) { alert(reason instanceof Error ? reason.message : "تعذر تغيير حالة الخبر"); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!confirm("حذف هذا الخبر نهائياً؟")) return;
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      if (!response.ok) { const result = await response.json() as { error?: string }; alert(result.error ?? "تعذر حذف الخبر"); }
      else router.refresh();
    } catch (reason) { alert(reason instanceof Error ? reason.message : "تعذر حذف الخبر"); }
    finally { setBusy(false); }
  }

  const isPublished = status === "published";
  return (
    <div className="flex items-center justify-end gap-2">
      <button type="button" disabled={busy} onClick={() => changeStatus(isPublished ? "draft" : "published")} className={`interactive-button rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-60 ${isPublished ? "border text-slate-700 hover:bg-muted" : "bg-primary text-primary-foreground"}`} title={isPublished ? "إلغاء النشر (رجعها مسودة)" : "نشر الخبر الآن"}>
        {isPublished ? "إلغاء نشر" : "نشر"}
      </button>
      <button type="button" disabled={busy} onClick={remove} className="interactive-button rounded-lg border px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60" title="حذف الخبر نهائياً">حذف</button>
    </div>
  );
}