-- =====================================================================
-- Happy Quiz — xavfsiz test platformasi (001)
--
-- Qanday ishga tushiriladi (dars bo'lmagan vaqtda):
--   1. Supabase → SQL Editor → shu faylning butun matnini qo'yib, Run bosing.
--   2. Admin parolini o'rnating. Bu qatorni faylga yozmang, faqat SQL Editor'da:
--        select quiz.set_admin_password('yangi-kuchli-parol');
--   3. Shundan keyin yangi frontend'ni deploy qiling.
--
-- Nima qiladi:
--   * Barcha jadvallar API'dan yashirin "quiz" sxemasida turadi. Brauzer faqat
--     pastdagi public RPC funksiyalarni chaqira oladi.
--   * Parollar bcrypt bilan saqlanadi, to'g'ri javob faqat serverda tekshiriladi.
--   * Eski jadvallar o'chirilmaydi: yopiq "quiz_legacy" sxemasiga ko'chadi,
--     o'quvchilar eski nickname/paroli bilan kiraveradi, savollar "Umumiy test"ga o'tadi.
--   * Qayta ishga tushirish xavfsiz: ma'lumotlar ikki marta ko'chirilmaydi.
-- =====================================================================

begin;

create extension if not exists pgcrypto with schema extensions;

create schema if not exists quiz;
create schema if not exists quiz_legacy;
revoke all on schema quiz, quiz_legacy from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Eski jadvallarni yopiq sxemaga ko'chirish
-- ---------------------------------------------------------------------
do $$
begin
  if to_regclass('public.students') is not null then
    alter table public.students set schema quiz_legacy;
  end if;
  if to_regclass('public.questions') is not null then
    alter table public.questions set schema quiz_legacy;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Jadvallar
-- ---------------------------------------------------------------------
create table if not exists quiz.students (
  id uuid primary key default gen_random_uuid(),
  nickname text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists quiz.tests (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  seconds_per_question int not null default 30 check (seconds_per_question between 5 and 600),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists quiz.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references quiz.tests (id) on delete cascade,
  question text not null check (char_length(question) > 0),
  options jsonb not null check (
    jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6
  ),
  correct_option smallint not null,
  points int not null default 10 check (points > 0),
  explanation text not null default '',
  created_at timestamptz not null default now(),
  check (correct_option >= 0 and correct_option < jsonb_array_length(options))
);
create index if not exists questions_test_id_idx on quiz.questions (test_id);

create table if not exists quiz.attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references quiz.students (id) on delete cascade,
  -- Test o'chirilsa ham o'quvchining natijasi tarixda qoladi
  test_id uuid references quiz.tests (id) on delete set null,
  question_ids uuid[] not null default '{}',
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  finished_at timestamptz,
  score int not null default 0,
  max_score int,
  correct_count int,
  wrong_count int,
  is_legacy boolean not null default false
);
create index if not exists attempts_student_id_idx on quiz.attempts (student_id);
create index if not exists attempts_test_id_idx on quiz.attempts (test_id);
-- Bitta o'quvchida bitta test bo'yicha bir vaqtda faqat bitta ochiq urinish
create unique index if not exists attempts_one_open_idx
  on quiz.attempts (student_id, test_id) where finished_at is null;

create table if not exists quiz.attempt_answers (
  attempt_id uuid not null references quiz.attempts (id) on delete cascade,
  question_id uuid not null references quiz.questions (id) on delete cascade,
  selected_option smallint not null,
  is_correct boolean not null,
  points_awarded int not null,
  answered_at timestamptz not null default now(),
  primary key (attempt_id, question_id)
);
create index if not exists attempt_answers_question_id_idx on quiz.attempt_answers (question_id);

create table if not exists quiz.sessions (
  token_hash text primary key,
  student_id uuid references quiz.students (id) on delete cascade,
  is_admin boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (is_admin or student_id is not null)
);

create table if not exists quiz.settings (
  id boolean primary key default true check (id),
  admin_password_hash text,
  admin_failed_attempts int not null default 0,
  admin_locked_until timestamptz
);
insert into quiz.settings default values on conflict do nothing;

alter table quiz.students enable row level security;
alter table quiz.tests enable row level security;
alter table quiz.questions enable row level security;
alter table quiz.attempts enable row level security;
alter table quiz.attempt_answers enable row level security;
alter table quiz.sessions enable row level security;
alter table quiz.settings enable row level security;

-- ---------------------------------------------------------------------
-- Eski ma'lumotlarni ko'chirish (faqat birinchi marta)
-- ---------------------------------------------------------------------
do $$
declare
  v_test_id uuid;
  v_options_type text;
  v_legacy_max int;
begin
  if exists (select 1 from quiz.tests) then
    return;
  end if;

  if to_regclass('quiz_legacy.questions') is not null then
    insert into quiz.tests (title, description, is_published)
    values ('Umumiy test', 'Avvalgi platformadagi barcha savollar', true)
    returning id into v_test_id;

    -- options ustuni jsonb yoki text[] bo'lishi mumkin
    select data_type into v_options_type
    from information_schema.columns
    where table_schema = 'quiz_legacy' and table_name = 'questions' and column_name = 'options';

    execute format(
      'insert into quiz.questions (test_id, question, options, correct_option, points, created_at)
       select $1, question, %s, "correctOption", coalesce(points, 10),
              now() + row_number() over (order by id) * interval ''1 millisecond''
       from quiz_legacy.questions',
      case when v_options_type = 'ARRAY' then 'to_jsonb(options)' else 'options::text::jsonb' end
    ) using v_test_id;

    select coalesce(sum(points), 0) into v_legacy_max from quiz.questions where test_id = v_test_id;
  end if;

  if to_regclass('quiz_legacy.students') is not null and not exists (select 1 from quiz.students) then
    -- Paroli yo'q eski yozuvga tasodifiy parol qo'yiladi (bo'sh parol bilan kirib bo'lmasin)
    insert into quiz.students (nickname, password_hash)
    select nickname,
           extensions.crypt(coalesce(password, gen_random_uuid()::text), extensions.gen_salt('bf', 8))
    from quiz_legacy.students;

    -- Oxirgi natija
    insert into quiz.attempts
      (student_id, test_id, started_at, finished_at, score, max_score, correct_count, wrong_count, is_legacy)
    select s.id, v_test_id, coalesce(l.updated_at, now()), coalesce(l.updated_at, now()),
           coalesce(l.last_points, 0), nullif(v_legacy_max, 0), l.last_correct, l.last_wrong, true
    from quiz_legacy.students l
    join quiz.students s on s.nickname = l.nickname
    where coalesce(l.last_correct, 0) + coalesce(l.last_wrong, 0) > 0;

    -- Eng yaxshi natija oxirgisidan yuqori bo'lsa, alohida urinish sifatida
    insert into quiz.attempts
      (student_id, test_id, started_at, finished_at, score, max_score, is_legacy)
    select s.id, v_test_id, coalesce(l.updated_at, now()) - interval '1 second',
           coalesce(l.updated_at, now()) - interval '1 second',
           l.best_points, nullif(v_legacy_max, 0), true
    from quiz_legacy.students l
    join quiz.students s on s.nickname = l.nickname
    where coalesce(l.best_points, 0) > coalesce(l.last_points, 0);
  end if;
end $$;

-- Eski jadvallarda ochiq parollar bor: hech kimga ruxsat yo'q
revoke all on all tables in schema quiz_legacy from public, anon, authenticated;
revoke all on all tables in schema quiz from public, anon, authenticated;
revoke all on all sequences in schema quiz_legacy from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Ichki yordamchi funksiyalar (quiz sxemasida — API orqali chaqirib bo'lmaydi)
-- ---------------------------------------------------------------------
create or replace function quiz.answer_grace() returns interval
language sql immutable set search_path = '' as $$
  select interval '10 seconds'
$$;

create or replace function quiz.hash_token(p_token text) returns text
language sql immutable set search_path = '' as $$
  select encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
$$;

create or replace function quiz.new_session(p_student_id uuid, p_is_admin boolean, p_ttl interval)
returns text
language plpgsql set search_path = '' as $$
declare
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  delete from quiz.sessions where expires_at < now();
  insert into quiz.sessions (token_hash, student_id, is_admin, expires_at)
  values (quiz.hash_token(v_token), p_student_id, p_is_admin, now() + p_ttl);
  return v_token;
end $$;

create or replace function quiz.require_student(p_token text) returns uuid
language plpgsql stable set search_path = '' as $$
declare
  v_student_id uuid;
begin
  select student_id into v_student_id
  from quiz.sessions
  where token_hash = quiz.hash_token(p_token) and not is_admin and expires_at > now();

  if v_student_id is null then
    raise exception 'session_expired';
  end if;
  return v_student_id;
end $$;

create or replace function quiz.require_admin(p_token text) returns void
language plpgsql stable set search_path = '' as $$
begin
  if not exists (
    select 1 from quiz.sessions
    where token_hash = quiz.hash_token(p_token) and is_admin and expires_at > now()
  ) then
    raise exception 'session_expired';
  end if;
end $$;

create or replace function quiz.is_valid_password(p_password text) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(
    char_length(p_password) between 8 and 72
      and p_password ~ '[A-Za-z]'
      and p_password ~ '[0-9]',
    false
  )
$$;

create or replace function quiz.student_json(p_student quiz.students) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object('id', p_student.id, 'nickname', p_student.nickname)
$$;

-- Urinishni yakunlaydi: ballni javoblardan hisoblaydi (allaqachon yopilgan bo'lsa, o'zgarmaydi)
create or replace function quiz.finalize_attempt(p_attempt_id uuid) returns void
language sql set search_path = '' as $$
  update quiz.attempts a set
    finished_at = least(now(), a.ends_at),
    score = s.score,
    correct_count = s.correct_count,
    wrong_count = s.wrong_count
  from (
    select
      coalesce(sum(points_awarded), 0)::int as score,
      (count(*) filter (where is_correct))::int as correct_count,
      (count(*) filter (where not is_correct))::int as wrong_count
    from quiz.attempt_answers
    where attempt_id = p_attempt_id
  ) s
  where a.id = p_attempt_id and a.finished_at is null
$$;

-- JSON'dan savolni tekshirib, jadval qatoriga aylantiradi
create or replace function quiz.build_question(p_test_id uuid, p_question jsonb)
returns quiz.questions
language plpgsql set search_path = '' as $$
declare
  v_row quiz.questions;
  v_option_count int;
begin
  if jsonb_typeof(p_question -> 'options') is distinct from 'array' then
    raise exception 'invalid_question';
  end if;

  v_row.test_id := p_test_id;
  v_row.question := btrim(coalesce(p_question ->> 'question', ''));
  v_row.options := (
    select jsonb_agg(btrim(value) order by ordinality)
    from jsonb_array_elements_text(p_question -> 'options') with ordinality
  );
  v_row.correct_option := (p_question ->> 'correct_option')::smallint;
  v_row.points := coalesce((p_question ->> 'points')::int, 10);
  v_row.explanation := btrim(coalesce(p_question ->> 'explanation', ''));
  v_option_count := coalesce(jsonb_array_length(v_row.options), 0);

  if v_row.question = ''
    or v_option_count not between 2 and 6
    or exists (select 1 from jsonb_array_elements_text(v_row.options) where value = '')
    or (select count(distinct lower(value)) from jsonb_array_elements_text(v_row.options)) <> v_option_count
    or v_row.correct_option is null
    or v_row.correct_option not between 0 and v_option_count - 1
    or v_row.points <= 0
  then
    raise exception 'invalid_question';
  end if;

  return v_row;
exception
  when invalid_text_representation or numeric_value_out_of_range then
    raise exception 'invalid_question';
end $$;

-- Admin parolini o'rnatish. Faqat SQL Editor'dan: select quiz.set_admin_password('...');
create or replace function quiz.set_admin_password(p_password text) returns void
language plpgsql set search_path = '' as $$
begin
  if char_length(coalesce(p_password, '')) < 8 then
    raise exception 'Parol kamida 8 ta belgidan iborat bo''lishi kerak';
  end if;
  update quiz.settings set
    admin_password_hash = extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
    admin_failed_attempts = 0,
    admin_locked_until = null;
  delete from quiz.sessions where is_admin;
end $$;

-- ---------------------------------------------------------------------
-- O'quvchi RPC funksiyalari
-- ---------------------------------------------------------------------
create or replace function public.register_student(p_nickname text, p_password text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_nickname text := btrim(coalesce(p_nickname, ''));
  v_student quiz.students;
begin
  if char_length(v_nickname) not between 2 and 30 then
    raise exception 'invalid_nickname';
  end if;
  if not quiz.is_valid_password(p_password) then
    raise exception 'weak_password';
  end if;

  insert into quiz.students (nickname, password_hash)
  values (v_nickname, extensions.crypt(p_password, extensions.gen_salt('bf', 8)))
  returning * into v_student;

  return jsonb_build_object(
    'token', quiz.new_session(v_student.id, false, interval '12 hours'),
    'student', quiz.student_json(v_student)
  );
exception
  when unique_violation then
    raise exception 'nickname_taken';
end $$;

create or replace function public.login_student(p_nickname text, p_password text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_student quiz.students;
begin
  select * into v_student from quiz.students where nickname = btrim(coalesce(p_nickname, ''));

  if v_student.id is null
    or v_student.password_hash <> extensions.crypt(coalesce(p_password, ''), v_student.password_hash)
  then
    raise exception 'invalid_credentials';
  end if;

  return jsonb_build_object(
    'token', quiz.new_session(v_student.id, false, interval '12 hours'),
    'student', quiz.student_json(v_student)
  );
end $$;

create or replace function public.get_student_session(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_student quiz.students;
begin
  select * into v_student from quiz.students where id = quiz.require_student(p_token);
  return quiz.student_json(v_student);
end $$;

create or replace function public.logout(p_token text) returns void
language sql security definer set search_path = '' as $$
  delete from quiz.sessions where token_hash = quiz.hash_token(p_token)
$$;

create or replace function public.list_tests(p_token text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_student_id uuid := quiz.require_student(p_token);
begin
  return coalesce((
    select jsonb_agg(to_jsonb(t) order by t.created_at desc)
    from (
      select
        te.id, te.title, te.description, te.seconds_per_question, te.created_at,
        count(q.id) as question_count,
        coalesce(sum(q.points), 0) as total_points,
        (select max(a.score) from quiz.attempts a
          where a.test_id = te.id and a.student_id = v_student_id and a.finished_at is not null) as best_score,
        (select count(*) from quiz.attempts a
          where a.test_id = te.id and a.student_id = v_student_id and a.finished_at is not null) as attempt_count,
        exists (select 1 from quiz.attempts a
          where a.test_id = te.id and a.student_id = v_student_id
            and a.finished_at is null and a.ends_at + quiz.answer_grace() > now()) as has_open_attempt
      from quiz.tests te
      left join quiz.questions q on q.test_id = te.id
      where te.is_published
      group by te.id
      having count(q.id) > 0
    ) t
  ), '[]'::jsonb);
end $$;

create or replace function public.start_attempt(p_token text, p_test_id uuid)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_student_id uuid := quiz.require_student(p_token);
  v_test quiz.tests;
  v_attempt quiz.attempts;
begin
  select * into v_test from quiz.tests where id = p_test_id and is_published;
  if v_test.id is null or not exists (select 1 from quiz.questions where test_id = p_test_id) then
    raise exception 'test_not_found';
  end if;

  -- Vaqti o'tib ketgan ochiq urinishlarni yopamiz
  perform quiz.finalize_attempt(a.id)
  from quiz.attempts a
  where a.student_id = v_student_id and a.finished_at is null
    and a.ends_at + quiz.answer_grace() < now();

  select * into v_attempt from quiz.attempts
  where student_id = v_student_id and test_id = p_test_id and finished_at is null;

  if v_attempt.id is null then
    begin
      insert into quiz.attempts (student_id, test_id, question_ids, ends_at, max_score)
      select v_student_id, p_test_id,
             array_agg(id order by random()),
             now() + make_interval(secs => (count(*) * v_test.seconds_per_question)::double precision),
             sum(points)
      from quiz.questions
      where test_id = p_test_id
      returning * into v_attempt;
    exception
      -- "Boshlash" ikki marta bosilsa: allaqachon yaratilgan urinishni qaytaramiz
      when unique_violation then
        select * into v_attempt from quiz.attempts
        where student_id = v_student_id and test_id = p_test_id and finished_at is null;
    end;
  end if;

  return jsonb_build_object(
    'attempt_id', v_attempt.id,
    'test', jsonb_build_object('id', v_test.id, 'title', v_test.title),
    'started_at', v_attempt.started_at,
    'ends_at', v_attempt.ends_at,
    'server_now', now(),
    'max_score', v_attempt.max_score,
    'questions', (
      select jsonb_agg(
        jsonb_build_object('id', q.id, 'question', q.question, 'options', q.options, 'points', q.points)
        order by array_position(v_attempt.question_ids, q.id)
      )
      from quiz.questions q
      where q.id = any (v_attempt.question_ids)
    ),
    'answers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'question_id', aa.question_id,
        'selected_option', aa.selected_option,
        'is_correct', aa.is_correct,
        'correct_option', q.correct_option,
        'points_awarded', aa.points_awarded,
        'explanation', q.explanation
      ))
      from quiz.attempt_answers aa
      join quiz.questions q on q.id = aa.question_id
      where aa.attempt_id = v_attempt.id
    ), '[]'::jsonb)
  );
end $$;

create or replace function public.submit_answer(
  p_token text, p_attempt_id uuid, p_question_id uuid, p_option int
)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_student_id uuid := quiz.require_student(p_token);
  v_attempt quiz.attempts;
  v_question quiz.questions;
  v_is_correct boolean;
  v_points int;
begin
  select * into v_attempt from quiz.attempts
  where id = p_attempt_id and student_id = v_student_id
  for update;

  if v_attempt.id is null
    or v_attempt.finished_at is not null
    or now() > v_attempt.ends_at + quiz.answer_grace()
  then
    raise exception 'attempt_closed';
  end if;

  select * into v_question from quiz.questions
  where id = p_question_id and id = any (v_attempt.question_ids);
  if v_question.id is null then
    raise exception 'question_not_found';
  end if;
  if p_option is null or p_option < 0 or p_option >= jsonb_array_length(v_question.options) then
    raise exception 'invalid_option';
  end if;

  v_is_correct := p_option = v_question.correct_option;
  v_points := case when v_is_correct then v_question.points else 0 end;

  insert into quiz.attempt_answers (attempt_id, question_id, selected_option, is_correct, points_awarded)
  values (p_attempt_id, p_question_id, p_option, v_is_correct, v_points);

  return jsonb_build_object(
    'is_correct', v_is_correct,
    'correct_option', v_question.correct_option,
    'points_awarded', v_points,
    'explanation', v_question.explanation
  );
exception
  when unique_violation then
    raise exception 'already_answered';
end $$;

create or replace function public.finish_attempt(p_token text, p_attempt_id uuid)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_student_id uuid := quiz.require_student(p_token);
  v_attempt quiz.attempts;
begin
  if not exists (select 1 from quiz.attempts where id = p_attempt_id and student_id = v_student_id) then
    raise exception 'attempt_not_found';
  end if;

  perform quiz.finalize_attempt(p_attempt_id);
  select * into v_attempt from quiz.attempts where id = p_attempt_id;

  return jsonb_build_object(
    'score', v_attempt.score,
    'max_score', v_attempt.max_score,
    'correct_count', v_attempt.correct_count,
    'wrong_count', v_attempt.wrong_count,
    'question_count', coalesce(array_length(v_attempt.question_ids, 1), 0),
    'best_score', (
      select max(score) from quiz.attempts
      where student_id = v_student_id and test_id = v_attempt.test_id and finished_at is not null
    ),
    'review', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'question_id', q.id,
          'question', q.question,
          'options', q.options,
          'correct_option', q.correct_option,
          'selected_option', aa.selected_option,
          'is_correct', coalesce(aa.is_correct, false),
          'points', q.points,
          'explanation', q.explanation
        )
        order by array_position(v_attempt.question_ids, q.id)
      )
      from quiz.questions q
      left join quiz.attempt_answers aa on aa.question_id = q.id and aa.attempt_id = v_attempt.id
      where q.id = any (v_attempt.question_ids)
    ), '[]'::jsonb)
  );
end $$;

-- ---------------------------------------------------------------------
-- Admin RPC funksiyalari
-- ---------------------------------------------------------------------

-- Xato parolda exception emas, javob qaytariladi: aks holda urinishlar hisobi
-- tranzaksiya bilan birga bekor bo'lib ketardi
create or replace function public.admin_login(p_password text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_settings quiz.settings;
begin
  select * into v_settings from quiz.settings for update;

  if v_settings.admin_password_hash is null then
    return jsonb_build_object('error', 'admin_not_configured');
  end if;
  if v_settings.admin_locked_until > now() then
    return jsonb_build_object('error', 'admin_locked');
  end if;

  if v_settings.admin_password_hash <> extensions.crypt(coalesce(p_password, ''), v_settings.admin_password_hash) then
    update quiz.settings set
      admin_failed_attempts = (admin_failed_attempts + 1) % 5,
      admin_locked_until = case
        when admin_failed_attempts + 1 >= 5 then now() + interval '5 minutes'
      end;
    return jsonb_build_object('error', 'invalid_credentials');
  end if;

  update quiz.settings set admin_failed_attempts = 0, admin_locked_until = null;
  return jsonb_build_object('token', quiz.new_session(null, true, interval '8 hours'));
end $$;

create or replace function public.verify_admin(p_token text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from quiz.sessions
    where token_hash = quiz.hash_token(p_token) and is_admin and expires_at > now()
  )
$$;

create or replace function public.admin_list_tests(p_token text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform quiz.require_admin(p_token);
  return coalesce((
    select jsonb_agg(to_jsonb(t) order by t.created_at desc)
    from (
      select
        te.*,
        (select count(*) from quiz.questions q where q.test_id = te.id) as question_count,
        (select coalesce(sum(points), 0) from quiz.questions q where q.test_id = te.id) as total_points,
        (select count(*) from quiz.attempts a where a.test_id = te.id and a.finished_at is not null) as attempt_count
      from quiz.tests te
    ) t
  ), '[]'::jsonb);
end $$;

create or replace function public.admin_save_test(p_token text, p_test jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_row quiz.tests;
begin
  perform quiz.require_admin(p_token);

  if p_test ->> 'id' is null then
    insert into quiz.tests (title, description, seconds_per_question, is_published)
    values (
      btrim(coalesce(p_test ->> 'title', '')),
      btrim(coalesce(p_test ->> 'description', '')),
      coalesce((p_test ->> 'seconds_per_question')::int, 30),
      coalesce((p_test ->> 'is_published')::boolean, false)
    )
    returning * into v_row;
  else
    update quiz.tests set
      title = btrim(coalesce(p_test ->> 'title', title)),
      description = btrim(coalesce(p_test ->> 'description', description)),
      seconds_per_question = coalesce((p_test ->> 'seconds_per_question')::int, seconds_per_question),
      is_published = coalesce((p_test ->> 'is_published')::boolean, is_published)
    where id = (p_test ->> 'id')::uuid
    returning * into v_row;

    if v_row.id is null then
      raise exception 'test_not_found';
    end if;
  end if;

  return to_jsonb(v_row);
exception
  when check_violation or invalid_text_representation or numeric_value_out_of_range then
    raise exception 'invalid_test';
end $$;

create or replace function public.admin_delete_test(p_token text, p_test_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform quiz.require_admin(p_token);
  delete from quiz.tests where id = p_test_id;
end $$;

create or replace function public.admin_list_questions(p_token text, p_test_id uuid)
returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform quiz.require_admin(p_token);
  return coalesce((
    select jsonb_agg(to_jsonb(q) order by q.created_at, q.id)
    from quiz.questions q
    where q.test_id = p_test_id
  ), '[]'::jsonb);
end $$;

create or replace function public.admin_save_question(p_token text, p_question jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_test_id uuid;
  v_input quiz.questions;
  v_row quiz.questions;
begin
  perform quiz.require_admin(p_token);

  if p_question ->> 'id' is null then
    v_test_id := (p_question ->> 'test_id')::uuid;
    if not exists (select 1 from quiz.tests where id = v_test_id) then
      raise exception 'test_not_found';
    end if;
    v_input := quiz.build_question(v_test_id, p_question);

    insert into quiz.questions (test_id, question, options, correct_option, points, explanation)
    values (v_input.test_id, v_input.question, v_input.options, v_input.correct_option,
            v_input.points, v_input.explanation)
    returning * into v_row;
  else
    select test_id into v_test_id from quiz.questions where id = (p_question ->> 'id')::uuid;
    if v_test_id is null then
      raise exception 'question_not_found';
    end if;
    v_input := quiz.build_question(v_test_id, p_question);

    update quiz.questions set
      question = v_input.question,
      options = v_input.options,
      correct_option = v_input.correct_option,
      points = v_input.points,
      explanation = v_input.explanation
    where id = (p_question ->> 'id')::uuid
    returning * into v_row;
  end if;

  return to_jsonb(v_row);
end $$;

create or replace function public.admin_add_questions(p_token text, p_test_id uuid, p_questions jsonb)
returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_item jsonb;
  v_input quiz.questions;
  v_count int := 0;
begin
  perform quiz.require_admin(p_token);
  if not exists (select 1 from quiz.tests where id = p_test_id) then
    raise exception 'test_not_found';
  end if;
  if jsonb_typeof(p_questions) is distinct from 'array' then
    raise exception 'invalid_question';
  end if;

  for v_item in select value from jsonb_array_elements(p_questions) loop
    v_input := quiz.build_question(p_test_id, v_item);
    insert into quiz.questions (test_id, question, options, correct_option, points, explanation, created_at)
    values (v_input.test_id, v_input.question, v_input.options, v_input.correct_option,
            v_input.points, v_input.explanation, now() + v_count * interval '1 millisecond');
    v_count := v_count + 1;
  end loop;

  return v_count;
end $$;

create or replace function public.admin_delete_question(p_token text, p_question_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform quiz.require_admin(p_token);
  delete from quiz.questions where id = p_question_id;
end $$;

create or replace function public.admin_results(p_token text, p_test_id uuid default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform quiz.require_admin(p_token);

  return (
    with finished as (
      select * from quiz.attempts
      where finished_at is not null and (p_test_id is null or test_id = p_test_id)
    ),
    per_student as (
      select
        s.id, s.nickname, s.created_at,
        count(f.id) as attempt_count,
        max(f.score) as best_score,
        max(round(100.0 * f.score / nullif(f.max_score, 0)))::int as best_percent,
        (array_agg(round(100.0 * f.score / nullif(f.max_score, 0))::int order by f.finished_at desc)
          filter (where f.id is not null))[1] as last_percent,
        max(f.finished_at) as last_finished_at
      from quiz.students s
      left join finished f on f.student_id = s.id
      group by s.id
    )
    select jsonb_build_object(
      'summary', jsonb_build_object(
        'student_count', count(*),
        'active_student_count', count(*) filter (where attempt_count > 0),
        'attempt_count', coalesce(sum(attempt_count), 0),
        'average_best_percent', round(avg(best_percent))
      ),
      'students', coalesce(
        jsonb_agg(to_jsonb(per_student)
          order by best_percent desc nulls last, best_score desc nulls last, nickname),
        '[]'::jsonb
      )
    )
    from per_student
  );
end $$;

create or replace function public.admin_student_attempts(p_token text, p_student_id uuid)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_student quiz.students;
begin
  perform quiz.require_admin(p_token);
  select * into v_student from quiz.students where id = p_student_id;
  if v_student.id is null then
    raise exception 'student_not_found';
  end if;

  return jsonb_build_object(
    'student', jsonb_build_object('id', v_student.id, 'nickname', v_student.nickname,
                                  'created_at', v_student.created_at),
    'attempts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'test_title', t.title,
        'score', a.score,
        'max_score', a.max_score,
        'correct_count', a.correct_count,
        'wrong_count', a.wrong_count,
        'started_at', a.started_at,
        'finished_at', a.finished_at,
        'is_legacy', a.is_legacy
      ) order by a.finished_at desc)
      from quiz.attempts a
      left join quiz.tests t on t.id = a.test_id
      where a.student_id = p_student_id and a.finished_at is not null
    ), '[]'::jsonb)
  );
end $$;

create or replace function public.admin_reset_student_password(
  p_token text, p_student_id uuid, p_password text
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform quiz.require_admin(p_token);
  if not quiz.is_valid_password(p_password) then
    raise exception 'weak_password';
  end if;

  update quiz.students
  set password_hash = extensions.crypt(p_password, extensions.gen_salt('bf', 8))
  where id = p_student_id;
  if not found then
    raise exception 'student_not_found';
  end if;

  delete from quiz.sessions where student_id = p_student_id;
end $$;

create or replace function public.admin_delete_student(p_token text, p_student_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform quiz.require_admin(p_token);
  delete from quiz.students where id = p_student_id;
end $$;

create or replace function public.admin_question_stats(p_token text, p_test_id uuid)
returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform quiz.require_admin(p_token);
  return coalesce((
    select jsonb_agg(to_jsonb(s) order by s.correct_percent asc nulls last, s.question)
    from (
      select
        q.id, q.question,
        count(aa.question_id) as answer_count,
        count(aa.question_id) filter (where aa.is_correct) as correct_count,
        round(100.0 * count(aa.question_id) filter (where aa.is_correct)
              / nullif(count(aa.question_id), 0))::int as correct_percent
      from quiz.questions q
      left join quiz.attempt_answers aa on aa.question_id = q.id
      where q.test_id = p_test_id
      group by q.id
    ) s
  ), '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------------
-- Ruxsatlar: brauzer (anon) faqat shu funksiyalarni chaqira oladi
-- ---------------------------------------------------------------------
revoke execute on all functions in schema quiz from public, anon, authenticated;

grant execute on function
  public.register_student(text, text),
  public.login_student(text, text),
  public.get_student_session(text),
  public.logout(text),
  public.list_tests(text),
  public.start_attempt(text, uuid),
  public.submit_answer(text, uuid, uuid, int),
  public.finish_attempt(text, uuid),
  public.admin_login(text),
  public.verify_admin(text),
  public.admin_list_tests(text),
  public.admin_save_test(text, jsonb),
  public.admin_delete_test(text, uuid),
  public.admin_list_questions(text, uuid),
  public.admin_save_question(text, jsonb),
  public.admin_add_questions(text, uuid, jsonb),
  public.admin_delete_question(text, uuid),
  public.admin_results(text, uuid),
  public.admin_student_attempts(text, uuid),
  public.admin_reset_student_password(text, uuid, text),
  public.admin_delete_student(text, uuid),
  public.admin_question_stats(text, uuid)
to anon, authenticated;

commit;

-- API sxema keshini yangilash
notify pgrst, 'reload schema';
