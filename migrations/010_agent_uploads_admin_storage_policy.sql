-- 010: let admins upload directly to the agent-uploads bucket from the browser.
--
-- The agent-uploads bucket is public (readable) and the AGENT writes to it via the
-- edge function using the service-role key, which bypasses RLS. But the admin shop-queue
-- UI uploads files DIRECTLY from the browser (services/shopDraftService.ts
-- uploadDraftPhotoFile -> supabase.storage.from('agent-uploads').upload(...)), which is
-- subject to storage RLS. No INSERT policy existed, so admin photo uploads failed with a
-- row-level-security error. This adds INSERT (and UPDATE/DELETE for completeness) for
-- is_admin users on that bucket.

create policy "Admins can upload to agent-uploads"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'agent-uploads'
  and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

create policy "Admins can update agent-uploads"
on storage.objects for update to authenticated
using (
  bucket_id = 'agent-uploads'
  and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

create policy "Admins can delete from agent-uploads"
on storage.objects for delete to authenticated
using (
  bucket_id = 'agent-uploads'
  and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
