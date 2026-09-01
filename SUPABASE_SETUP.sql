-- ============================================
-- SQL COMMANDS TO RUN ON SUPABASE DIRECTLY
-- تعليمات الـ SQL التي يجب تنفيذها على Supabase مباشرة
-- ============================================

-- 1. إنشاء جدول journalists (إذا لم يكن موجود)
-- ============================================
CREATE TABLE IF NOT EXISTS public.journalists (
  id uuid primary key default gen_random_uuid(),
  display_name varchar(255) not null,
  email varchar(255),
  bio text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- تفعيل RLS على جدول journalists
ALTER TABLE public.journalists ENABLE ROW LEVEL SECURITY;

-- Policy للقراءة (الكل يقدر يقرأ)
DROP POLICY IF EXISTS "journalists_read_policy" ON public.journalists;
CREATE POLICY "journalists_read_policy" ON public.journalists
  FOR SELECT USING (true);

-- Policy للكتابة والتعديل والحذف (المالك والمدير فقط)
DROP POLICY IF EXISTS "journalists_write_policy" ON public.journalists;
CREATE POLICY "journalists_write_policy" ON public.journalists
  FOR ALL TO authenticated USING (
    (select role from public.profiles where id = auth.uid()) in ('super_admin', 'manager')
  ) WITH CHECK (
    (select role from public.profiles where id = auth.uid()) in ('super_admin', 'manager')
  );

-- 2. إضافة الأعمدة الجديدة في site_settings (إذا لم تكن موجودة)
-- ============================================
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_facebook text default null;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_youtube text default null;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_twitter text default null;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS contact_phone text default null;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS contact_address text default null;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS contact_whatsapp text default null;

-- 3. إصلاح RLS Policies للـ site_settings
-- ============================================
-- شيل الـ policies القديمة
DROP POLICY IF EXISTS "staff view settings" ON public.site_settings;
DROP POLICY IF EXISTS "settings managers update settings" ON public.site_settings;
DROP POLICY IF EXISTS "public read site settings" ON public.site_settings;

-- أضف policies الصحيحة
-- يسمح لكل الناس بقراءة الإعدادات
CREATE POLICY "public read site settings" ON public.site_settings 
  FOR SELECT USING (true);

-- يسمح للمالك والموظفين المختصين بالتحديث
CREATE POLICY "admin manage settings" ON public.site_settings 
  FOR ALL TO authenticated USING (
    public.is_super_admin() OR public.has_permission('settings.maintenance')
  ) WITH CHECK (
    public.is_super_admin() OR public.has_permission('settings.maintenance')
  );

-- 4. إضافة trigger لتحديث updated_at تلقائياً
-- ============================================
DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings 
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 5. إضافة صلاحيات جديدة (إذا لم تكن موجودة)
-- ============================================
INSERT INTO public.permissions (key, label, description) VALUES
  ('journalists.manage', 'إدارة الصحفيين', 'إضافة وتعديل وحذف الصحفيين والمراسلين'),
  ('settings.maintenance', 'إدارة الصيانة والسوشيال ميديا', 'تفعيل وضع الصيانة وإضافة/حذف روابط السوشيال ميديا')
ON CONFLICT (key) DO UPDATE SET label = excluded.label, description = excluded.description;

-- ============================================
-- نهاية الأوامر
-- ============================================
-- ملاحظة: هذه الأوامر يجب تنفيذها في Supabase SQL Editor
-- Supabase → SQL Editor → Paste these commands → Run
