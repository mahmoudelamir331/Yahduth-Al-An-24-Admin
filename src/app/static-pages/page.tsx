import AdminShell from "@/components/AdminShell";
import StaticPagesEditor from "@/components/StaticPagesEditor";
import { requirePermission } from "@/lib/authorization";

export default async function StaticPagesPage() {
  await requirePermission("settings");

  return (
    <AdminShell title="الصفحات الثابتة">
      <main className="min-h-screen bg-background p-4 text-foreground sm:p-8">
        <div className="mx-auto max-w-6xl animate-rise-in">
          <div className="mb-6">
            <p className="text-sm font-semibold text-primary">إدارة محتوى الموقع العام</p>
            <h2 className="mt-1 text-2xl font-black">محرر الصفحات الثابتة</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              عدّل صفحات من نحن، تواصل معنا، سياسة الخصوصية، والشروط والأحكام واحفظ التغييرات مباشرة.
            </p>
          </div>
          <StaticPagesEditor />
        </div>
      </main>
    </AdminShell>
  );
}
