-- إدارة البث المباشر من لوحة الأدمن.
alter table public.site_settings
  add column if not exists live_streams jsonb not null default '[]'::jsonb;

-- القراءة العامة موجودة أصلًا لإعدادات الموقع، ونضمن سياسة التحديث للصلاحيات المطلوبة.
drop policy if exists "settings managers update settings" on public.site_settings;
create policy "settings managers update settings" on public.site_settings
  for update to authenticated
  using (
    public.has_permission('settings.manage') or
    public.has_permission('settings.maintenance') or
    public.has_permission('system.manage') or
    public.has_permission('media.manage')
  )
  with check (
    public.has_permission('settings.manage') or
    public.has_permission('settings.maintenance') or
    public.has_permission('system.manage') or
    public.has_permission('media.manage')
  );
