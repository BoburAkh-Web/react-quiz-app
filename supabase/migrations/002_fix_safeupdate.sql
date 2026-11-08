-- =====================================================================
-- Happy Quiz — 002: Supabase "safeupdate" himoyasiga moslash
--
-- Qanday ishga tushiriladi: Supabase → SQL Editor → shu faylning butun matnini
-- qo'yib, Run bosing. Admin parolini qayta o'rnatish shart emas.
--
-- Sabab: Supabase API orqali kelgan so'rovlarda WHERE'siz UPDATE/DELETE taqiqlangan
-- ("UPDATE requires a WHERE clause"). quiz.settings bitta qatorli jadval bo'lgani uchun
-- 001'da WHERE yozilmagan edi va admin login shu sabab ishlamadi.
-- =====================================================================

begin;

create or replace function quiz.set_admin_password(p_password text) returns void
language plpgsql set search_path = '' as $$
begin
  if char_length(coalesce(p_password, '')) < 8 then
    raise exception 'Parol kamida 8 ta belgidan iborat bo''lishi kerak';
  end if;
  update quiz.settings set
    admin_password_hash = extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
    admin_failed_attempts = 0,
    admin_locked_until = null
  where id;
  delete from quiz.sessions where is_admin;
end $$;

-- Xato parolda exception emas, javob qaytariladi: aks holda urinishlar hisobi
-- tranzaksiya bilan birga bekor bo'lib ketardi
create or replace function public.admin_login(p_password text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_settings quiz.settings;
begin
  select * into v_settings from quiz.settings where id for update;

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
      end
    where id;
    return jsonb_build_object('error', 'invalid_credentials');
  end if;

  update quiz.settings set admin_failed_attempts = 0, admin_locked_until = null where id;
  return jsonb_build_object('token', quiz.new_session(null, true, interval '8 hours'));
end $$;

commit;

-- API sxema keshini yangilash
notify pgrst, 'reload schema';
