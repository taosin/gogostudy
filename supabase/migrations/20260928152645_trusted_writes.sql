-- Authenticated clients may read their own rows through RLS. Mutations now go
-- through the application server after bearer-token and workflow checks.
begin;

revoke insert, update, delete
  on public.profiles, public.attempts, public.reflections
  from authenticated;

grant select
  on public.profiles, public.attempts, public.reflections
  to authenticated;

drop policy if exists profiles_own_insert on public.profiles;
drop policy if exists profiles_own_update on public.profiles;
drop policy if exists attempts_own_insert on public.attempts;
drop policy if exists reflections_own_insert on public.reflections;

-- New Supabase secret keys assume the service_role database role. Grants are
-- checked before BYPASSRLS, so grant only what these server routes use.
grant select, insert, update on public.profiles to service_role;
grant select, insert on public.attempts, public.reflections to service_role;

-- Supports the workflow lookup in /api/attempts: equality filters first,
-- followed by its deterministic created_at / id ordering columns.
create index if not exists attempts_user_course_question_created
  on public.attempts(user_id, course_key, question_id, created_at, id);

commit;
