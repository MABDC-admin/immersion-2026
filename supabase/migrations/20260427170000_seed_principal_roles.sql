DO $$
DECLARE
  missing_emails text[];
BEGIN
  WITH target_emails(email) AS (
    VALUES
      ('macalintaljanalfred@gmail.com'),
      ('aknsager@gmail.com')
  ),
  matched_users AS (
    SELECT auth_user.id, target_emails.email
    FROM target_emails
    JOIN auth.users AS auth_user
      ON lower(auth_user.email) = target_emails.email
  )
  INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'principal'::public.app_role
  FROM matched_users
  ON CONFLICT (user_id, role) DO NOTHING;

  WITH target_emails(email) AS (
    VALUES
      ('macalintaljanalfred@gmail.com'),
      ('aknsager@gmail.com')
  )
  SELECT array_agg(target_emails.email)
  INTO missing_emails
  FROM target_emails
  LEFT JOIN auth.users AS auth_user
    ON lower(auth_user.email) = target_emails.email
  WHERE auth_user.id IS NULL;

  IF missing_emails IS NOT NULL THEN
    RAISE NOTICE 'No auth user found for principal email(s): %', array_to_string(missing_emails, ', ');
  END IF;
END
$$;
