import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChatConversation, ChatMessage, SendMessageInput, ChatMember } from '@/types/chat';

export function useChat(conversationId?: string) {
    const queryClient = useQueryClient();

    // Fetch conversations for the current employee
    const useConversations = (employeeId: string) => {
        return useQuery({
            queryKey: ['chat', 'conversations', employeeId],
            queryFn: async () => {
                const { data, error } = await supabase
                    .from('conversations')
                    .select(`
                        *,
                        members:conversation_members(
                            *,
                            employee:employees(id, first_name, last_name, avatar_url)
                        )
                    `)
                    .order('updated_at', { ascending: false });

                if (error) throw error;
                return data as ChatConversation[];
            },
            enabled: !!employeeId,
        });
    };

    // Fetch messages for a conversation
    const useMessages = (conversationId?: string) => {
        return useQuery({
            queryKey: ['chat', 'messages', conversationId],
            queryFn: async () => {
                const { data, error } = await supabase
                    .from('messages')
                    .select(`
                        *,
                        sender:employees(id, first_name, last_name, avatar_url)
                    `)
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                return data as ChatMessage[];
            },
            enabled: !!conversationId,
        });
    };

    // Send a message
    const useSendMessage = () => {
        return useMutation({
            mutationFn: async ({ conversation_id, content, sender_id }: SendMessageInput & { sender_id: string }) => {
                const { data, error } = await supabase
                    .from('messages')
                    .insert([
                        {
                            conversation_id,
                            content,
                            sender_id,
                        },
                    ])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            },
            onSuccess: (_, variables) => {
                queryClient.invalidateQueries({ queryKey: ['chat', 'messages', variables.conversation_id] });
                queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
            },
        });
    };

    // Subscribe to realtime messages
    const subscribeToConversation = (conversationId: string, onNewMessage: (message: ChatMessage) => void) => {
        const channel = supabase
            .channel(`conversation:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    onNewMessage(payload.new as ChatMessage);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    return {
        useConversations,
        useMessages,
        useSendMessage,
        subscribeToConversation,
    };
}
