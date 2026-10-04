-- Record hint use and graded attempts on the database side. The RPC serializes
-- each learner/question workflow so two stale correction or review requests
-- cannot both commit.
begin;

create table public.hint_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid not null,
  question_id text not null check (char_length(question_id) between 1 and 100),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  primary key (user_id, attempt_id)
);

alter table public.hint_sessions enable row level security;

create index hint_sessions_expires_at
  on public.hint_sessions(expires_at);

revoke all on public.hint_sessions from public, anon, authenticated;
grant select, insert, update, delete on public.hint_sessions to service_role;

create or replace function public.record_hint_session(
  p_user_id uuid,
  p_attempt_id uuid,
  p_question_id text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing_question_id text;
  v_active_count integer;
begin
  if p_user_id is null
    or p_attempt_id is null
    or nullif(p_question_id, '') is null
    or char_length(p_question_id) > 100 then
    raise exception using message = 'INVALID_HINT_SESSION', errcode = 'P0001';
  end if;

  -- One user-level lock makes cleanup, counting, and insertion one atomic
  -- quota decision even when several browser tabs request hints together.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('hint-user:' || p_user_id::text, 0)
  );

  delete from public.hint_sessions
  where user_id = p_user_id
    and expires_at <= pg_catalog.clock_timestamp();

  select question_id
  into v_existing_question_id
  from public.hint_sessions
  where user_id = p_user_id and attempt_id = p_attempt_id
  for update;

  if found and v_existing_question_id is distinct from p_question_id then
    raise exception using message = 'HINT_ID_CONFLICT', errcode = 'P0001';
  end if;

  if not found then
    select count(*)
    into v_active_count
    from public.hint_sessions
    where user_id = p_user_id;

    if v_active_count >= 50 then
      raise exception using message = 'HINT_RATE_LIMIT', errcode = 'P0001';
    end if;
  end if;

  insert into public.hint_sessions (
    user_id,
    attempt_id,
    question_id,
    created_at,
    expires_at
  ) values (
    p_user_id,
    p_attempt_id,
    p_question_id,
    pg_catalog.clock_timestamp(),
    pg_catalog.clock_timestamp() + interval '30 minutes'
  )
  on conflict (user_id, attempt_id) do update
  set
    created_at = excluded.created_at,
    expires_at = excluded.expires_at;
end;
$$;

revoke execute on function public.record_hint_session(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.record_hint_session(uuid, uuid, text)
  to service_role;

create or replace function public.record_attempt(
  p_user_id uuid,
  p_attempt jsonb,
  p_workflow_version uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_attempt_id uuid := nullif(p_attempt ->> 'id', '')::uuid;
  v_question_id text := p_attempt ->> 'question_id';
  v_course_key text := p_attempt ->> 'course_key';
  v_mode text := p_attempt ->> 'mode';
  v_existing public.attempts%rowtype;
  v_inserted public.attempts%rowtype;
  v_history record;
  v_latest_id uuid;
  v_hint_attempt_id uuid;
  v_support_level text := 'independent';
  v_status text := 'clear';
  v_due_at timestamptz := null;
  v_review_step integer := 0;
  v_intervals integer[] := array[1, 3, 7];
begin
  if p_user_id is null
    or v_attempt_id is null
    or nullif(v_question_id, '') is null
    or nullif(v_course_key, '') is null
    or v_mode not in ('practice', 'correction', 'review') then
    raise exception using message = 'INVALID_ATTEMPT', errcode = 'P0001';
  end if;

  -- A separate lock for the idempotency key also covers the unlikely case
  -- where two requests reuse one UUID for different questions.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('attempt:' || v_attempt_id::text, 0)
  );

  select *
  into v_existing
  from public.attempts
  where id = v_attempt_id;

  if found then
    if v_existing.user_id is distinct from p_user_id
      or v_existing.question_id is distinct from v_question_id
      or v_existing.course_key is distinct from v_course_key
      or v_existing.answer is distinct from (p_attempt ->> 'answer')
      or v_existing.mode is distinct from v_mode
      or v_existing.reason is distinct from coalesce(p_attempt ->> 'reason', '') then
      raise exception using message = 'IDEMPOTENCY_CONFLICT', errcode = 'P0001';
    end if;
    delete from public.hint_sessions
    where user_id = p_user_id
      and question_id = v_question_id
      and attempt_id = v_attempt_id;
    return pg_catalog.to_jsonb(v_existing);
  end if;

  -- Serialize the whole question workflow, including different request UUIDs.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'workflow:' || p_user_id::text || ':' || v_course_key || ':' || v_question_id,
      0
    )
  );

  select id
  into v_latest_id
  from public.attempts
  where user_id = p_user_id
    and course_key = v_course_key
    and question_id = v_question_id
  order by created_at desc, id desc
  limit 1;

  if v_mode <> 'practice'
    and v_latest_id is distinct from p_workflow_version then
    raise exception using message = 'WORKFLOW_STALE', errcode = 'P0001';
  end if;

  for v_history in
    select correct, mode, support_level, created_at
    from public.attempts
    where user_id = p_user_id
      and course_key = v_course_key
      and question_id = v_question_id
    order by created_at, id
  loop
    if not v_history.correct or v_history.support_level <> 'independent' then
      v_status := 'pending';
      v_due_at := null;
      v_review_step := 0;
    elsif v_status = 'pending' and v_history.mode = 'correction' then
      v_status := 'review';
      v_due_at := v_history.created_at +
        pg_catalog.make_interval(days => v_intervals[v_review_step + 1]);
    elsif v_status = 'review'
      and v_history.mode = 'review'
      and v_due_at is not null
      and (v_history.created_at at time zone 'Asia/Shanghai')::date >=
        (v_due_at at time zone 'Asia/Shanghai')::date then
      v_review_step := v_review_step + 1;
      if v_review_step >= pg_catalog.array_length(v_intervals, 1) then
        v_status := 'mastered';
        v_due_at := null;
      else
        v_due_at := v_history.created_at +
          pg_catalog.make_interval(days => v_intervals[v_review_step + 1]);
      end if;
    end if;
  end loop;

  if v_mode = 'correction' and v_status <> 'pending' then
    raise exception using message = 'CORRECTION_NOT_PENDING', errcode = 'P0001';
  end if;
  if v_mode = 'review' and (
    v_status <> 'review'
    or v_due_at is null
    or (v_due_at at time zone 'Asia/Shanghai')::date >
      (pg_catalog.clock_timestamp() at time zone 'Asia/Shanghai')::date
  ) then
    raise exception using message = 'REVIEW_NOT_DUE', errcode = 'P0001';
  end if;

  select attempt_id
  into v_hint_attempt_id
  from public.hint_sessions
  where user_id = p_user_id
    and attempt_id = v_attempt_id
    and question_id = v_question_id
    and expires_at > pg_catalog.clock_timestamp()
  for update;

  if found or (v_mode = 'practice' and v_status = 'pending') then
    v_support_level := 'hint';
  end if;

  insert into public.attempts (
    id,
    user_id,
    question_id,
    course_key,
    package_id,
    content_version,
    unit_id,
    skill_id,
    difficulty,
    question_type,
    variant_group,
    review_status,
    support_level,
    question,
    answer,
    correct,
    mode,
    reason,
    expected,
    explanation,
    created_at
  ) values (
    v_attempt_id,
    p_user_id,
    v_question_id,
    v_course_key,
    p_attempt ->> 'package_id',
    p_attempt ->> 'content_version',
    p_attempt ->> 'unit_id',
    p_attempt ->> 'skill_id',
    p_attempt ->> 'difficulty',
    p_attempt ->> 'question_type',
    p_attempt ->> 'variant_group',
    p_attempt ->> 'review_status',
    v_support_level,
    p_attempt -> 'question',
    p_attempt ->> 'answer',
    (p_attempt ->> 'correct')::boolean,
    v_mode,
    coalesce(p_attempt ->> 'reason', ''),
    p_attempt ->> 'expected',
    p_attempt ->> 'explanation',
    pg_catalog.clock_timestamp()
  )
  returning * into v_inserted;

  delete from public.hint_sessions
  where user_id = p_user_id
    and attempt_id = v_attempt_id
    and question_id = v_question_id;

  return pg_catalog.to_jsonb(v_inserted);
end;
$$;

revoke execute on function public.record_attempt(uuid, jsonb, uuid)
  from public, anon, authenticated;
grant execute on function public.record_attempt(uuid, jsonb, uuid)
  to service_role;

commit;
