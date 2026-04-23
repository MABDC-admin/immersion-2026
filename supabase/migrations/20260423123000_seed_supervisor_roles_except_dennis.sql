INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT manager.user_id, 'supervisor'::public.app_role
FROM public.employees AS manager
WHERE manager.user_id IS NOT NULL
  AND lower(manager.email) <> 'sottodennis@gmail.com'
  AND EXISTS (
    SELECT 1
    FROM public.employees AS intern
    WHERE intern.manager_id = manager.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles AS existing_role
    WHERE existing_role.user_id = manager.user_id
      AND existing_role.role = 'supervisor'::public.app_role
  );
