-- VIP controls: live broadcast, visitor bans, and public content protection.

alter table public.site_settings
  add column if not exists live_enabled boolean not null default false,
  add column if not exists live_url text,
  add column if not exists live_platform text,
  add column if not exists content_protection_enabled boolean not null default false,
  add column if not exists anti_adblock_enabled boolean not null default false;

alter table public.categories add column if not exists is_active boolean not null default true;
drop policy if exists "managers manage categories" on public.categories;
create policy "category managers manage categories" on public.categories
  for all to authenticated using (
    public.is_super_admin() or public.has_permission('categories.manage')
  ) with check (
    public.is_super_admin() or public.has_permission('categories.manage')
  );
drop policy if exists "public read public categories" on public.categories;
create policy "public read active categories" on public.categories
  for select to anon using (is_active);
insert into public.permissions (key, label, description) values
  ('categories.manage', 'إدارة الأقسام', 'إضافة وتعديل وإخفاء وحذف أقسام الموقع')
on conflict (key) do update set label = excluded.label, description = excluded.description;

insert into public.categories (name, slug, is_active) values
  ('أخبار أسوان', 'aswan', true),
  ('عاجل', 'urgent', true),
  ('سياسة واقتصاد', 'politics', true),
  ('تحقيقات وحوارات', 'reports', true),
  ('رياضة وتكنولوجيا', 'sports', true)
on conflict (slug) do update set is_active = true;

create table if not exists public.banned_ips (
  id uuid primary key default gen_random_uuid(),
  ip_address inet not null unique,
  reason text not null default '',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists banned_ips_active_ip_idx on public.banned_ips(ip_address) where is_active;
alter table public.banned_ips enable row level security;

insert into public.permissions (key, label, description) values
  ('stats.view', 'عرض الإحصائيات', 'عرض أرقام وإحصائيات المنصة'),
  ('team.manage', 'إدارة الفريق', 'إضافة وتعديل وإيقاف أعضاء الفريق'),
  ('vip.manage', 'إدارة المميزات المتقدمة', 'إدارة البث والحظر وحماية المحتوى'),
  ('settings.vip', 'إعدادات المميزات المتقدمة', 'تفعيل البث والحماية ومكافحة مانع الإعلانات')
on conflict (key) do update set label = excluded.label, description = excluded.description;

create policy "public check active banned ips" on public.banned_ips
  for select to anon using (is_active);

create policy "vip managers manage banned ips" on public.banned_ips
  for all to authenticated using (
    public.is_super_admin() or public.has_permission('vip.manage')
  ) with check (
    public.is_super_admin() or public.has_permission('vip.manage')
  );

create or replace function public.is_ip_banned(candidate inet)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.banned_ips where ip_address = candidate and is_active) $$;

grant execute on function public.is_ip_banned(inet) to anon, authenticated;
