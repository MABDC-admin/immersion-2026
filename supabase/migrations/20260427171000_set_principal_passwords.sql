CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  missing_emails text[];
BEGIN
  UPDATE auth.users
  SET
    encrypted_password = extensions.crypt('MABDC@2026', extensions.gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmation_token = '',
    recovery_token = '',
    updated_at = now()
  WHERE lower(email) IN (
    'macalintaljanalfred@gmail.com',
    'aknsager@gmail.com'
  );

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
    RAISE NOTICE 'Password was not set because no auth user was found for: %', array_to_string(missing_emails, ', ');
  END IF;
END
$$;
