import LogoutButton from "@/components/LogoutButton";

export default function UnauthorizedPage() {
  return <main className="grid min-h-screen place-items-center bg-background px-6 text-center"><section className="max-w-md rounded-2xl border bg-card p-8 shadow-sm"><div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-amber-100 text-2xl dark:bg-amber-950/40">!</div><h1 className="text-2xl font-black">ليس لديك صلاحيات</h1><p className="mt-3 text-sm leading-7 text-muted-foreground">حسابك لا يملك صلاحية الوصول إلى هذه الصفحة. تواصل مع المدير العام لإضافة الصلاحية المطلوبة.</p><LogoutButton /></section></main>;
}
