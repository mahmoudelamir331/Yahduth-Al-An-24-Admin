"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return <button type="button" onClick={() => void logout()} disabled={busy} className="interactive-button inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60 dark:hover:bg-rose-950/30"><LogOut size={17} />{busy ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}</button>;
}
