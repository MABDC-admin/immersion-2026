
-- Create a function to atomically create a direct conversation with members
CREATE OR REPLACE FUNCTION public.create_direct_conversation(
    creator_id uuid,
    target_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    existing_conv_id uuid;
    new_conv_id uuid;
BEGIN
    -- Check if direct conversation already exists
    SELECT find_direct_conversation(creator_id, target_id) INTO existing_conv_id;
    IF existing_conv_id IS NOT NULL THEN
        RETURN existing_conv_id;
    END IF;

    -- Create new conversation
    INSERT INTO conversations (type) VALUES ('direct') RETURNING id INTO new_conv_id;

    -- Add both members
    INSERT INTO conversation_members (conversation_id, employee_id)
    VALUES (new_conv_id, creator_id), (new_conv_id, target_id);

    RETURN new_conv_id;
END;
$function$;
