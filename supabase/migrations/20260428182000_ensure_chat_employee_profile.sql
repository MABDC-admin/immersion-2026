CREATE OR REPLACE FUNCTION public.ensure_chat_employee_profile(
  user_email text,
  role_label text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  matched_employee_id uuid;
  matched_user_id uuid;
  clean_email text := lower(trim(user_email));
  local_part text;
  generated_employee_id text;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF clean_email IS NULL OR clean_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  SELECT id INTO matched_employee_id
  FROM public.employees
  WHERE user_id = current_user_id
  LIMIT 1;

  IF matched_employee_id IS NOT NULL THEN
    RETURN matched_employee_id;
  END IF;

  SELECT id, user_id
  INTO matched_employee_id, matched_user_id
  FROM public.employees
  WHERE lower(email) = clean_email
  ORDER BY created_at ASC
  LIMIT 1;

  IF matched_employee_id IS NOT NULL THEN
    IF matched_user_id IS NOT NULL AND matched_user_id <> current_user_id THEN
      RAISE EXCEPTION 'Employee email is already linked to another login account';
    END IF;

    UPDATE public.employees
    SET user_id = current_user_id
    WHERE id = matched_employee_id;

    RETURN matched_employee_id;
  END IF;

  local_part := split_part(clean_email, '@', 1);
  generated_employee_id := 'CHAT-' || upper(substr(replace(current_user_id::text, '-', ''), 1, 10));

  INSERT INTO public.employees (
    user_id,
    employee_id,
    first_name,
    last_name,
    email,
    job_title,
    status
  )
  VALUES (
    current_user_id,
    generated_employee_id,
    initcap(replace(local_part, '.', ' ')),
    'Portal',
    clean_email,
    COALESCE(role_label, 'Portal Account'),
    'active'
  )
  RETURNING id INTO matched_employee_id;

  RETURN matched_employee_id;
END;
$$;
