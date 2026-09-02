-- Ensure employees can read their own permission rows so dashboard navigation is filtered correctly.
alter table public.user_permissions enable row level security;

drop policy if exists "staff read own permissions" on public.user_permissions;
create policy "staff read own permissions"
  on public.user_permissions for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

drop policy if exists "super admins manage permissions" on public.user_permissions;
create policy "super admins manage permissions"
  on public.user_permissions for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create unique index if not exists user_permissions_user_key_idx
  on public.user_permissions (user_id, permission_key);
