-- Apply through the managed Supabase migration workflow.
begin;
create table public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 course jsonb not null
   default '{"province":"浙江省","textbook":"人教版","grade":"二年级","semester":"上册","subject":"数学"}'::jsonb
   constraint profiles_course_is_object check(jsonb_typeof(course) = 'object')
   constraint profiles_course_size check(octet_length(course::text) <= 2048),
 updated_at timestamptz not null default now()
);
create table public.attempts (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 question_id text not null check(char_length(question_id) between 1 and 100),
 course_key text not null check(char_length(course_key) between 1 and 100),
 question jsonb not null
   constraint attempts_question_is_object check(jsonb_typeof(question) = 'object')
   constraint attempts_question_size check(octet_length(question::text) <= 16384),
 answer text not null check(char_length(answer) between 1 and 100),
 correct boolean not null,
 mode text not null check(mode in ('practice','correction','review')),
 reason text not null default '' check(reason in ('','计算时出错','题目没读清','方法还不熟','单位或时间弄混')),
 expected text not null check(char_length(expected) between 1 and 100),
 explanation text not null check(char_length(explanation) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index attempts_user_created on public.attempts(user_id,created_at,id);
create table public.reflections (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 course_key text not null check(char_length(course_key) between 1 and 100),
 body text not null check(char_length(body) between 1 and 500),
 created_at timestamptz not null default now()
);
create index reflections_user_created on public.reflections(user_id,created_at desc,id desc);
revoke all on public.profiles,public.attempts,public.reflections from PUBLIC,anon,authenticated;
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
commit;
