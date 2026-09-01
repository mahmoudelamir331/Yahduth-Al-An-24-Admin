-- جدول إدارة الصحفيين والمراسلين
create table if not exists public.journalists (
  id uuid primary key default gen_random_uuid(),
  display_name varchar(255) not null, -- اسم العرض (ممكن يختلف عن الاسم الحقيقي)
  email varchar(255),
  bio text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- جدول ربط الأخبار بالصحفي
alter table if exists public.articles add column if not exists journalist_id uuid references public.journalists(id) on delete set null;

-- إضافة صلاحيات جديدة
insert into public.permissions (key, label, description) values
  ('journalists.manage', 'إدارة الصحفيين', 'إضافة وتعديل وحذف الصحفيين والمراسلين')
on conflict (key) do update set label = excluded.label, description = excluded.description;

-- تفعيل RLS (Row Level Security)
alter table public.journalists enable row level security;

-- Policy للقراءة (الكل يقدر يقرأ)
create policy "journalists_read_policy" on public.journalists
  for select using (true);

-- Policy للكتابة والتعديل والحذف (المالك والمدير فقط)
create policy "journalists_write_policy" on public.journalists
  for all using (
    (select role from public.profiles where id = auth.uid()) in ('super_admin', 'manager')
  );
