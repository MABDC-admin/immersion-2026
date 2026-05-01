update auth.users
set encrypted_password = crypt('Denskie123', gen_salt('bf')),
    updated_at = now()
where id = '60fbc7c6-100a-4246-99c3-5d8cc8957bca';