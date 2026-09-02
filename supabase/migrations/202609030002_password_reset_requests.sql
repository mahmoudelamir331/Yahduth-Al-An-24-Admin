alter table public.password_reset_requests
  alter column requested_password_hash drop not null,
  add column if not exists requested_password_ciphertext text,
  add column if not exists rejection_reason text;

create index if not exists password_reset_requests_status_idx
  on public.password_reset_requests(status, created_at desc);

drop policy if exists "users create own reset request" on public.password_reset_requests;
create policy "authenticated users create own reset request"
  on public.password_reset_requests for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users view own reset request" on public.password_reset_requests;
create policy "users view own reset request"
  on public.password_reset_requests for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin() or public.has_permission('team.manage'));
