-- إصلاح صلاحيات الحفظ من لوحة الأدمن.
-- هذه السياسات لا تمنح صلاحيات جديدة؛ هي توحّد الصلاحيات الموجودة في الواجهة مع RLS.

drop policy if exists "settings managers update settings" on public.site_settings;
drop policy if exists "settings managers insert settings" on public.site_settings;

create policy "settings managers insert settings" on public.site_settings
  for insert to authenticated
  with check (
    public.has_permission('settings.manage') or
    public.has_permission('settings.maintenance') or
    public.has_permission('system.manage')
  );

create policy "settings managers update settings" on public.site_settings
  for update to authenticated
  using (
    public.has_permission('settings.manage') or
    public.has_permission('settings.maintenance') or
    public.has_permission('system.manage')
  )
  with check (
    public.has_permission('settings.manage') or
    public.has_permission('settings.maintenance') or
    public.has_permission('system.manage')
  );

create policy "journalists managers insert" on public.journalists
  for insert to authenticated
  with check (public.has_permission('journalists.manage'));

create policy "journalists managers update" on public.journalists
  for update to authenticated
  using (public.has_permission('journalists.manage'))
  with check (public.has_permission('journalists.manage'));

create policy "journalists managers delete" on public.journalists
  for delete to authenticated
  using (public.has_permission('journalists.manage'));

create or replace function public.set_journalist_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists journalists_updated_at on public.journalists;
create trigger journalists_updated_at
before update on public.journalists
for each row execute procedure public.set_journalist_updated_at();

-- يضمن أن الأخبار المنشورة تظهر في القراءة العامة.
create or replace function public.set_article_publish_timestamp()
returns trigger language plpgsql as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  elsif new.status <> 'published' then
    new.published_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists articles_publish_timestamp on public.articles;
create trigger articles_publish_timestamp
before insert or update on public.articles
for each row execute procedure public.set_article_publish_timestamp();
