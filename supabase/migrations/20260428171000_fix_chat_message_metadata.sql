-- Preserve attachment metadata for chat messages.
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_messages_metadata_type
ON public.messages ((metadata ->> 'file_type'));
