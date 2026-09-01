-- إضافة أعمدة وسائل التواصل والسوشيال ميديا
alter table public.site_settings add column if not exists social_facebook text default null;
alter table public.site_settings add column if not exists social_youtube text default null;
alter table public.site_settings add column if not exists social_twitter text default null;
alter table public.site_settings add column if not exists contact_phone text default null;
alter table public.site_settings add column if not exists contact_address text default null;
alter table public.site_settings add column if not exists contact_whatsapp text default null;
