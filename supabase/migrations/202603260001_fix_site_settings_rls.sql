-- إصلاح RLS policies لـ site_settings
-- المشكلة: الـ policy القديم لا يسمح للمالك (super_admin) بالتحديث

-- شيل الـ policies القديمة
drop policy if exists "staff view settings" on public.site_settings;
drop policy if exists "settings managers update settings" on public.site_settings;
drop policy if exists "public read site settings" on public.site_settings;

-- أضف policies الصحيحة
-- يسمح لكل الناس بقراءة الإعدادات
create policy "public read site settings" on public.site_settings for select using (true);

-- يسمح للمالك والموظفين المختصين بالتحديث
create policy "admin manage settings" on public.site_settings for all to authenticated using (
  public.is_super_admin() or public.has_permission('settings.maintenance')
) with check (
  public.is_super_admin() or public.has_permission('settings.maintenance')
);

-- إضافة trigger لتحديث updated_at تلقائياً
drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at before update on public.site_settings 
  for each row execute procedure public.set_updated_at();
