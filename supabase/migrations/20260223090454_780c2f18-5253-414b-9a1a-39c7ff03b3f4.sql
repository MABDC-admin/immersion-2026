
-- Create a function to atomically create a group conversation
CREATE OR REPLACE FUNCTION public.create_group_conversation(
    creator_id uuid,
    member_ids uuid[],
    group_title text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    new_conv_id uuid;
    member_id uuid;
BEGIN
    -- Create the conversation
    INSERT INTO conversations (type, title)
    VALUES ('group', COALESCE(group_title, 'Group Chat'))
    RETURNING id INTO new_conv_id;

    -- Add the creator as admin
    INSERT INTO conversation_members (conversation_id, employee_id, role)
    VALUES (new_conv_id, creator_id, 'admin');

    -- Add all other members
    FOREACH member_id IN ARRAY member_ids
    LOOP
        IF member_id != creator_id THEN
            INSERT INTO conversation_members (conversation_id, employee_id, role)
            VALUES (new_conv_id, member_id, 'member');
        END IF;
    END LOOP;

    RETURN new_conv_id;
END;
$$;
