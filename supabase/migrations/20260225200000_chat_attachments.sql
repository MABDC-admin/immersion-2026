-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-attachments', 
    'chat-attachments', 
    true, 
    104857600, -- 100MB
    '{image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain}'
)
ON CONFLICT (id) DO 
    UPDATE SET public = true;

-- Storage policies for chat attachments
-- We use the helper check_chat_membership(conv_id, auth.uid()) 
-- but path is chat-attachments/{conversation_id}/{file_name}
-- So we need to extract conversation_id from the path (name)

CREATE POLICY "Users can view attachments in their conversations"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'chat-attachments' AND 
    check_chat_membership((storage.foldername(name))[1]::uuid, auth.uid())
);

CREATE POLICY "Users can upload attachments to their conversations"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-attachments' AND 
    check_chat_membership((storage.foldername(name))[1]::uuid, auth.uid())
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'chat-attachments' AND 
    (storage.foldername(name))[1]::uuid IS NOT NULL AND
    check_chat_membership((storage.foldername(name))[1]::uuid, auth.uid())
);
