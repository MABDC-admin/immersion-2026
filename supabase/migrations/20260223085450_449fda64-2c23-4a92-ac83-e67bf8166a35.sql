
-- Make the trigger function SECURITY DEFINER so it can update conversations timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$function$;

-- Add UPDATE policy on conversations for members (needed for last_read_at updates etc.)
CREATE POLICY "Members can update their conversations"
ON public.conversations
FOR UPDATE
USING (check_chat_membership(id, auth.uid()));

-- Add DELETE policy on messages for senders (soft delete)
CREATE POLICY "Users can soft delete their own messages"
ON public.messages
FOR DELETE
USING (sender_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));
