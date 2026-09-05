import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { getCurrentAccess } from "@/lib/authorization";
import { createClient } from "@/lib/supabase-server";
import BackButton from "@/components/BackButton";

function formatToday() {
  return new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
}

export default async function AdminShell({ children, title = "لوحة التحكم" }: { children: ReactNode; title?: string }) {
  const access = await getCurrentAccess();
  const supabase = await createClient();
  const profileResult = access.user
    ? await supabase.from("profiles").select("full_name").eq("user_id", access.user.id).maybeSingle()
    : { data: null };
  const profile = profileResult.data as { full_name?: string | null } | null;
  const name = profile?.full_name?.trim() || access.user?.email?.split("@")[0] || "المستخدم";

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar permissions={access.navigationPermissions} />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-3 border-b bg-background/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <BackButton />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-primary">{formatToday()}</p>
              <h1 className="truncate text-lg font-black sm:text-2xl">{title === "لوحة التحكم" ? `مرحبًا، ${name}` : title}</h1>
            </div>
          </div>
          <span className="hidden rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-primary sm:inline-flex">حساب موظف</span>
        </header>
        <div className="min-h-[calc(100vh-81px)]">{children}</div>
      </div>
    </div>
  );
}
