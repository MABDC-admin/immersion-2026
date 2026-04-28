import type { Json } from '@/integrations/supabase/types';

export type ConversationType = 'direct' | 'group' | 'hr_support';
export type ChatMessageType = 'text' | 'attachment' | 'system' | 'image' | 'video' | 'file' | 'gallery';

export type ChatMetadata = Record<string, Json | undefined>;

export interface ChatConversation {
    id: string;
    type: ConversationType;
    title?: string;
    metadata?: ChatMetadata;
    created_at: string;
    updated_at: string;
    last_message?: ChatMessage;
    members?: ChatMember[];
}

export interface ChatMember {
    conversation_id: string;
    employee_id: string;
    role: 'admin' | 'member';
    joined_at: string;
    last_read_at: string;
    employee?: {
        id: string;
        first_name: string;
        last_name: string;
        avatar_url?: string;
    };
}

export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    type: ChatMessageType;
    metadata?: ChatMetadata;
    is_edited: boolean;
    is_deleted: boolean;
    created_at: string;
    sender?: {
        first_name: string;
        last_name: string;
        avatar_url?: string;
    };
}

export interface SendMessageInput {
    conversation_id: string;
    content: string;
    type?: ChatMessageType;
    metadata?: ChatMetadata;
}
