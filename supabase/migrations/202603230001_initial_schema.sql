-- يحدث الآن: مخطط ERP المصغر. ينفذ عبر Supabase SQL Editor أو CLI.
create extension if not exists "pgcrypto";

create type public.app_role as enum ('super_admin', 'manager', 'editor', 'advertiser');
create type public.article_status as enum ('draft', 'scheduled', 'published', 'archived');
create type public.reset_request_status as enum ('pending', 'approved', 'rejected');
create type public.ad_type as enum ('image', 'adsense');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'editor',
  is_active boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.permissions (
  key text primary key,
  label text not null,
  description text not null
);

insert into public.permissions (key, label, description) values
  ('news.view', 'عرض الأخبار', 'عرض قائمة الأخبار ومحتواها'),
  ('news.create', 'إضافة خبر', 'إنشاء مسودات وأخبار'),
  ('news.edit', 'تعديل الأخبار', 'تعديل الأخبار المصرح بها'),
  ('news.publish', 'نشر الأخبار', 'نشر وجدولة الأخبار'),
  ('media.manage', 'إدارة الميديا', 'رفع وإدارة مكتبة الصور'),
  ('ads.manage', 'إدارة الإعلانات', 'إدارة مساحات الإعلانات'),
  ('pages.manage', 'إدارة الصفحات', 'تعديل الصفحات الثابتة'),
  ('settings.manage', 'إدارة الإعدادات', 'إدارة إعدادات المنصة'),
  ('users.manage', 'إدارة الفريق', 'إنشاء الحسابات وتحديد صلاحياتها'),
  ('system.manage', 'عمليات النظام', 'الصيانة والإشعارات والنسخ الاحتياطي');

create table public.user_permissions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (user_id, permission_key)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  excerpt text not null default '',
  content jsonb not null default '[]'::jsonb,
  cover_image_url text,
  author_name text not null,
  status public.article_status not null default 'draft',
  is_urgent boolean not null default false,
  is_headline boolean not null default false,
  published_at timestamptz,
  scheduled_for timestamptz,
  views_count integer not null default 0 check (views_count >= 0),
  read_minutes smallint not null default 1 check (read_minutes > 0),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scheduled_articles_need_date check (status <> 'scheduled' or scheduled_for is not null)
);

create table public.article_tags (
  article_id uuid not null references public.articles(id) on delete cascade,
  tag text not null,
  primary key (article_id, tag)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_path text not null unique,
  public_url text not null,
  alt_text text not null default '',
  mime_type text not null,
  width integer,
  height integer,
  size_bytes bigint not null check (size_bytes >= 0),
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.ads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  placement text not null check (placement in ('header', 'sidebar', 'article')),
  type public.ad_type not null,
  image_url text,
  target_url text,
  adsense_code text,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint image_ad_data check (type <> 'image' or (image_url is not null and target_url is not null)),
  constraint adsense_ad_data check (type <> 'adsense' or adsense_code is not null)
);

create table public.site_settings (
  id boolean primary key default true check (id),
  founder_name text not null default '',
  founder_description text not null default '',
  founder_image_url text,
  founder_contact_url text,
  maintenance_enabled boolean not null default false,
  maintenance_message text not null default 'الموقع تحت الصيانة حالياً.',
  maintenance_ends_at timestamptz,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.static_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content jsonb not null default '[]'::jsonb,
  is_published boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  requested_password_hash text not null,
  status public.reset_request_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index articles_status_published_at_idx on public.articles(status, published_at desc);
create index articles_category_id_idx on public.articles(category_id);
create index activity_logs_created_at_idx on public.activity_logs(created_at desc);
create index password_reset_requests_status_idx on public.password_reset_requests(status, created_at desc);

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin' and is_active) $$;

create or replace function public.has_permission(required_key text)
returns boolean language sql stable security definer set search_path = public
as $$ select public.is_super_admin() or exists (select 1 from public.user_permissions up join public.profiles p on p.id = up.user_id where up.user_id = auth.uid() and up.permission_key = required_key and p.is_active) $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger articles_updated_at before update on public.articles for each row execute procedure public.set_updated_at();
create trigger ads_updated_at before update on public.ads for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.permissions enable row level security;
alter table public.user_permissions enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.article_tags enable row level security;
alter table public.media_assets enable row level security;
alter table public.ads enable row level security;
alter table public.site_settings enable row level security;
alter table public.static_pages enable row level security;
alter table public.password_reset_requests enable row level security;
alter table public.activity_logs enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "authenticated users view own profile" on public.profiles for select to authenticated using (id = auth.uid() or public.is_super_admin());
create policy "super admins manage profiles" on public.profiles for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "staff read permissions" on public.permissions for select to authenticated using (true);
create policy "staff read own permissions" on public.user_permissions for select to authenticated using (user_id = auth.uid() or public.is_super_admin());
create policy "super admins manage permissions" on public.user_permissions for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "staff view categories" on public.categories for select to authenticated using (true);
create policy "managers manage categories" on public.categories for all to authenticated using (public.has_permission('news.publish')) with check (public.has_permission('news.publish'));
create policy "permitted staff view articles" on public.articles for select to authenticated using (public.has_permission('news.view'));
create policy "permitted staff create articles" on public.articles for insert to authenticated with check (public.has_permission('news.create') and created_by = auth.uid());
create policy "permitted staff update articles" on public.articles for update to authenticated using (public.has_permission('news.edit')) with check (public.has_permission('news.edit'));
create policy "publishers delete articles" on public.articles for delete to authenticated using (public.has_permission('news.publish'));
create policy "staff view article tags" on public.article_tags for select to authenticated using (public.has_permission('news.view'));
create policy "editors manage article tags" on public.article_tags for all to authenticated using (public.has_permission('news.edit')) with check (public.has_permission('news.edit'));
create policy "media managers manage assets" on public.media_assets for all to authenticated using (public.has_permission('media.manage')) with check (public.has_permission('media.manage'));
create policy "ad managers manage ads" on public.ads for all to authenticated using (public.has_permission('ads.manage')) with check (public.has_permission('ads.manage'));
create policy "staff view settings" on public.site_settings for select to authenticated using (true);
create policy "settings managers update settings" on public.site_settings for update to authenticated using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));
create policy "staff view static pages" on public.static_pages for select to authenticated using (true);
create policy "page managers manage static pages" on public.static_pages for all to authenticated using (public.has_permission('pages.manage')) with check (public.has_permission('pages.manage'));
create policy "users create own reset request" on public.password_reset_requests for insert to authenticated with check (user_id = auth.uid());
create policy "users view own reset request" on public.password_reset_requests for select to authenticated using (user_id = auth.uid() or public.is_super_admin());
create policy "super admins review reset requests" on public.password_reset_requests for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "super admins view activity logs" on public.activity_logs for select to authenticated using (public.is_super_admin());
create policy "system managers view push subscriptions" on public.push_subscriptions for select to authenticated using (public.has_permission('system.manage'));

create policy "public read published articles" on public.articles for select to anon using (status = 'published' and published_at <= now());
create policy "public read public categories" on public.categories for select to anon using (true);
create policy "public read active ads" on public.ads for select to anon using (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));
create policy "public read visible static pages" on public.static_pages for select to anon using (is_published);
create policy "public read site settings" on public.site_settings for select to anon using (true);
create policy "public subscribe to notifications" on public.push_subscriptions for insert to anon with check (true);
