
-- Drop the restrictive INSERT policy and recreate as PERMISSIVE
DROP POLICY "Users can create conversations" ON public.conversations;

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);
