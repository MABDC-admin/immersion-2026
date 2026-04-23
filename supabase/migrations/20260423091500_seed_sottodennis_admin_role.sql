DO $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id
  INTO target_user_id
  FROM auth.users
  WHERE lower(email) = 'sottodennis@gmail.com'
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'No auth user found for sottodennis@gmail.com';
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END
$$;
