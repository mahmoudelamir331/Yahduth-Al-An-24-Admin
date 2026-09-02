-- Fix admin panel write paths for ads and site settings.

-- Ensure the single settings row exists.
insert into public.site_settings (id)
values (true)
on conflict (id) do nothing;

-- Keep the maintenance/settings policies open to the actual roles used by the UI.
drop policy if exists "admin manage settings" on public.site_settings;
drop policy if exists "settings managers update settings" on public.site_settings;
drop policy if exists "staff view settings" on public.site_settings;
drop policy if exists "public read site settings" on public.site_settings;

create policy "public read site settings" on public.site_settings
  for select using (true);

create policy "admin manage settings" on public.site_settings
  for all to authenticated using (
    public.is_super_admin()
    or public.has_permission('settings.manage')
    or public.has_permission('settings.maintenance')
  ) with check (
    public.is_super_admin()
    or public.has_permission('settings.manage')
    or public.has_permission('settings.maintenance')
  );

-- Let the ads UI use the same write permissions it hands out in the role templates.
drop policy if exists "ad managers manage ads" on public.ads;

create policy "ad managers manage ads" on public.ads
  for all to authenticated using (
    public.is_super_admin()
    or public.has_permission('ads.manage')
    or public.has_permission('ads.create')
    or public.has_permission('ads.toggle')
  ) with check (
    public.is_super_admin()
    or public.has_permission('ads.manage')
    or public.has_permission('ads.create')
    or public.has_permission('ads.toggle')
  );

-- Align ad placement values with the admin form.
alter table public.ads drop constraint if exists ads_placement_check;
alter table public.ads
  add constraint ads_placement_check
  check (placement in ('header', 'sidebar', 'article', 'bottom'));

-- Track uploaded banner files so deletes can clean up storage objects.
alter table public.ads
  add column if not exists storage_path text;

-- Create the ads bucket if it does not exist yet.
insert into storage.buckets (id, name, public)
values ('ads', 'ads', true)
on conflict (id) do nothing;
