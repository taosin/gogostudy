-- Run once in Supabase SQL Editor, or apply with `supabase db push`.
begin;
create table public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 course jsonb not null default '{"province":"浙江省","textbook":"人教版","grade":"二年级","semester":"上册","subject":"数学"}'::jsonb,
 updated_at timestamptz not null default now()
);
create table public.attempts (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 question_id text not null,
 course_key text not null,
 question jsonb not null,
 answer text not null check(char_length(answer) between 1 and 100),
 correct boolean not null,
 mode text not null check(mode in ('practice','correction','review')),
 reason text not null default '',
 expected text not null,
 explanation text not null,
 created_at timestamptz not null default now()
);
create index attempts_user_created on public.attempts(user_id,created_at,id);
create table public.reflections (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 course_key text not null,
 body text not null check(char_length(body) between 1 and 500),
 created_at timestamptz not null default now()
);
create index reflections_user_created on public.reflections(user_id,created_at desc);
alter table public.profiles enable row level security;
alter table public.attempts enable row level security;
alter table public.reflections enable row level security;
create policy profiles_own_select on public.profiles for select to authenticated using ((select auth.uid())=user_id);
create policy profiles_own_insert on public.profiles for insert to authenticated with check ((select auth.uid())=user_id);
create policy profiles_own_update on public.profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy attempts_own_select on public.attempts for select to authenticated using ((select auth.uid())=user_id);
create policy attempts_own_insert on public.attempts for insert to authenticated with check ((select auth.uid())=user_id);
create policy reflections_own_select on public.reflections for select to authenticated using ((select auth.uid())=user_id);
create policy reflections_own_insert on public.reflections for insert to authenticated with check ((select auth.uid())=user_id);
grant select,insert,update on public.profiles to authenticated;
grant select,insert on public.attempts,public.reflections to authenticated;
revoke all on public.profiles,public.attempts,public.reflections from anon;
commit;
