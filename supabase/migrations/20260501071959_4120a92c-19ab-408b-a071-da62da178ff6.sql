do $$
declare
  new_uid uuid := gen_random_uuid();
  existing_uid uuid;
begin
  select id into existing_uid from auth.users where lower(email) = 'aknsager@mail.com' limit 1;

  if existing_uid is not null then
    update auth.users
    set encrypted_password = crypt('MABDC@2026', gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = existing_uid;
    new_uid := existing_uid;
  else
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token,
      email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      new_uid, 'authenticated', 'authenticated',
      'aknsager@mail.com',
      crypt('MABDC@2026', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb, false, '', '', '', ''
    );

    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), new_uid,
      jsonb_build_object('sub', new_uid::text, 'email', 'aknsager@mail.com', 'email_verified', true),
      'email', new_uid::text, now(), now(), now());
  end if;

  insert into public.profiles (user_id) values (new_uid)
  on conflict (user_id) do nothing;

  -- remove default 'employee' role auto-added by trigger if present
  delete from public.user_roles where user_id = new_uid and role = 'employee'::public.app_role;

  insert into public.user_roles (user_id, role)
  values (new_uid, 'principal'::public.app_role)
  on conflict (user_id, role) do nothing;
end
$$;