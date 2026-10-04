-- Add immutable curriculum-package metadata without moving legacy progress
-- into the new 2025 course package.
begin;

alter table public.profiles
  alter column course set default
    '{"province":"浙江省","textbook":"人教版","grade":"二年级","semester":"上册","subject":"数学","revision":"2025课程包"}'::jsonb;

update public.profiles
set
  course = course || '{"revision":"旧版课程包"}'::jsonb,
  updated_at = now()
where not (course ? 'revision');

alter table public.attempts
  add column package_id text not null default 'pep-math-g2s1-legacy',
  add column content_version text not null default 'legacy.1',
  add column unit_id text not null default 'legacy-unit-unknown',
  add column skill_id text not null default 'legacy-skill-unknown',
  add column difficulty text not null default 'foundation',
  add column question_type text not null default 'numeric',
  add column variant_group text not null default 'legacy-unknown',
  add column review_status text not null default 'reviewed',
  add column support_level text not null default 'independent';

update public.attempts
set
  course_key =
    '浙江省/人教版/二年级/上册/数学/pkg:pep-math-g2s1-legacy',
  package_id = 'pep-math-g2s1-legacy',
  content_version = 'legacy.1',
  unit_id = 'legacy-unit-' || coalesce(nullif(question ->> 'topic', ''), 'unknown'),
  skill_id = 'legacy-skill-' || coalesce(nullif(question ->> 'topic', ''), 'unknown'),
  difficulty = 'foundation',
  question_type = case
    when jsonb_typeof(question -> 'options') = 'array' then 'choice'
    else 'numeric'
  end,
  variant_group = 'legacy-' || question_id,
  review_status = 'reviewed',
  support_level = 'independent',
  question = question || jsonb_build_object(
    'packageId', 'pep-math-g2s1-legacy',
    'contentVersion', 'legacy.1',
    'unitId', 'legacy-unit-' || coalesce(nullif(question ->> 'topic', ''), 'unknown'),
    'skillId', 'legacy-skill-' || coalesce(nullif(question ->> 'topic', ''), 'unknown'),
    'difficulty', 'foundation',
    'questionType', case
      when jsonb_typeof(question -> 'options') = 'array' then 'choice'
      else 'numeric'
    end,
    'variantGroup', 'legacy-' || question_id,
    'author', 'original',
    'reviewStatus', 'reviewed'
  )
where
  course_key = '浙江省/人教版/二年级/上册/数学'
  or not (question ? 'packageId');

alter table public.attempts
  add constraint attempts_package_id_length
    check (char_length(package_id) between 1 and 100),
  add constraint attempts_content_version_length
    check (char_length(content_version) between 1 and 50),
  add constraint attempts_unit_id_length
    check (char_length(unit_id) between 1 and 100),
  add constraint attempts_skill_id_length
    check (char_length(skill_id) between 1 and 100),
  add constraint attempts_difficulty_check
    check (difficulty in ('foundation', 'application', 'reasoning')),
  add constraint attempts_question_type_check
    check (question_type in ('numeric', 'choice')),
  add constraint attempts_variant_group_length
    check (char_length(variant_group) between 1 and 100),
  add constraint attempts_review_status_check
    check (review_status in ('draft', 'reviewed')),
  add constraint attempts_support_level_check
    check (support_level in ('independent', 'hint', 'guided'));

alter table public.attempts
  drop constraint if exists attempts_reason_check;

alter table public.attempts
  add constraint attempts_reason_check check (
    reason in (
      '',
      '计算时出错',
      '题目没读清',
      '口诀还没想起',
      '分类标准混淆',
      '单位或测量弄混',
      '方法还不熟',
      '单位或时间弄混'
    )
  );

update public.reflections
set course_key =
  '浙江省/人教版/二年级/上册/数学/pkg:pep-math-g2s1-legacy'
where course_key = '浙江省/人教版/二年级/上册/数学';

create index attempts_user_package_created
  on public.attempts(user_id, package_id, created_at, id);

create index reflections_user_course_created
  on public.reflections(user_id, course_key, created_at desc, id desc);

commit;
