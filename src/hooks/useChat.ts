import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChatConversation, ChatMessage, SendMessageInput, ChatMember } from '@/types/chat';
import { useEffect, useRef, useState } from 'react';

type ChatConversationWithReadState = ChatConversation & {
    my_last_read_at?: string | null;
    unread_count?: number;
};

type ConversationMembership = {
    last_read_at: string | null;
    conversation: (ChatConversation & { members?: ChatMember[] }) | null;
};

type ChatPresenceState = {
    online_at?: string;
    typing_in?: string | null;
};

const getErrorMessage = (error: unknown, fallback: string) => (
    error instanceof Error ? error.message : fallback
);

export function useChat(conversationId?: string) {
    const queryClient = useQueryClient();

    // Fetch conversations for the current employee
    const useConversations = (employeeId: string) => {
        return useQuery({
            queryKey: ['chat', 'conversations', employeeId],
            queryFn: async () => {
                const { data: memberships, error: membershipError } = await supabase
                    .from('conversation_members')
                    .select(`
                        last_read_at,
                        conversation:conversations(
                            *,
                            members:conversation_members(
                                *,
                                employee:employees(id, first_name, last_name, avatar_url)
                            )
                        )
                    `)
                    .eq('employee_id', employeeId);

                if (membershipError) throw membershipError;

                const convs = ((memberships || []) as ConversationMembership[])
                    .map((membership) => ({
                        ...(membership.conversation || {}),
                        my_last_read_at: membership.last_read_at,
                    }))
                    .filter((conversation): conversation is ChatConversationWithReadState => Boolean(conversation?.id))
                    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

                // For each conversation, fetch unread count for current employee
                const convsWithUnread = await Promise.all((convs || []).map(async (conv) => {
                    const myMember = conv.members?.find((m) => m.employee_id === employeeId);
                    if (!myMember) return { ...conv, unread_count: 0, last_message: undefined };

                    const { data: lastMessage } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('conversation_id', conv.id)
                        .eq('is_deleted', false)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    let unreadQuery = supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('conversation_id', conv.id)
                        .neq('sender_id', employeeId);

                    const lastReadAt = myMember.last_read_at || conv.my_last_read_at;
                    if (lastReadAt) {
                        unreadQuery = unreadQuery.gt('created_at', lastReadAt);
                    }

                    const { count } = await unreadQuery;

                    return { ...conv, unread_count: count || 0, last_message: lastMessage || undefined };
                }));

                return convsWithUnread as (ChatConversation & { unread_count: number })[];
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
                    .eq('is_deleted', false)
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
            mutationFn: async ({ conversation_id, content, sender_id, type = 'text', metadata = {} }: SendMessageInput & { sender_id: string }) => {
                const { data, error } = await supabase
                    .from('messages')
                    .insert([
                        {
                            conversation_id,
                            content,
                            sender_id,
                            type,
                            metadata,
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

    // Delete a conversation
    const useDeleteConversation = () => {
        return useMutation({
            mutationFn: async (id: string) => {
                const { error } = await supabase
                    .from('conversations')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
                toast.success('Conversation deleted');
            },
            onError: (error: unknown) => {
                toast.error(getErrorMessage(error, 'Failed to delete conversation'));
            }
        });
    };

    // Mark messages as read
    const useMarkAsRead = () => {
        return useMutation({
            mutationFn: async ({ conversationId, employeeId }: { conversationId: string; employeeId: string }) => {
                const { error } = await supabase
                    .from('conversation_members')
                    .update({ last_read_at: new Date().toISOString() })
                    .eq('conversation_id', conversationId)
                    .eq('employee_id', employeeId);

                if (error) throw error;
            },
            onSuccess: (_, variables) => {
                queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', variables.employeeId] });
            },
        });
    };

    // Get total unread count across all conversations
    const useTotalUnreadCount = (employeeId: string) => {
        const { data: conversations = [] } = useConversations(employeeId);
        return conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
    };

    // Upload attachment
    const useUploadAttachment = () => {
        return useMutation({
            mutationFn: async ({ conversationId, file }: { conversationId: string; file: File }) => {
                const MAX_SIZE = 100 * 1024 * 1024; // 100MB
                if (file.size > MAX_SIZE) throw new Error('File size exceeds 100MB limit');

                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                const filePath = `${conversationId}/${fileName}`;

                const { data, error } = await supabase.storage
                    .from('chat-attachments')
                    .upload(filePath, file);

                if (error) throw error;
                return { path: data.path, name: file.name, type: file.type };
            }
        });
    };

    // Presence tracking
    const usePresence = (employeeId: string, conversationId?: string) => {
        const [onlineEmployeeIds, setOnlineEmployeeIds] = useState<Set<string>>(new Set());
        const [typingUsers, setTypingUsers] = useState<Record<string, Set<string>>>({}); // convId -> Set<employeeId>
        const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

        useEffect(() => {
            if (!employeeId) return;

            const channel = supabase.channel('chat-presence', {
                config: {
                    presence: {
                        key: employeeId,
                    },
                },
            });
            channelRef.current = channel;

            channel
                .on('presence', { event: 'sync' }, () => {
                    const state = channel.presenceState();
                    const onlineIds = new Set(Object.keys(state));
                    setOnlineEmployeeIds(onlineIds);

                    // Rebuild typing users map
                    const nextTyping: Record<string, Set<string>> = {};
                    Object.entries(state).forEach(([empId, presences]) => {
                        if (empId === employeeId) return;
                        (presences as ChatPresenceState[]).forEach(presence => {
                            if (presence.typing_in) {
                                if (!nextTyping[presence.typing_in]) nextTyping[presence.typing_in] = new Set();
                                nextTyping[presence.typing_in].add(empId);
                            }
                        });
                    });
                    setTypingUsers(nextTyping);
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await channel.track({
                            online_at: new Date().toISOString(),
                            typing_in: null
                        });
                    }
                });

            return () => {
                channelRef.current = null;
                supabase.removeChannel(channel);
            };
        }, [employeeId]);

        const setTyping = async (convId: string | null) => {
            if (!channelRef.current) return;

            await channelRef.current.track({
                online_at: new Date().toISOString(),
                typing_in: convId
            });
        };

        return { onlineEmployeeIds, typingUsers, setTyping };
    };

    // Global listener for new messages to update unread counts
    const useGlobalChatSync = (employeeId: string) => {
        useEffect(() => {
            if (!employeeId) return;

            const messageChannel = supabase
                .channel('global-chat-sync')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages' },
                    (payload) => {
                        // Check if the message is NOT from the current user
                        if (payload.new.sender_id !== employeeId) {
                            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', employeeId] });
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'conversation_members', filter: `employee_id=eq.${employeeId}` },
                    () => {
                        // When last_read_at is updated (e.g. from another tab)
                        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', employeeId] });
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(messageChannel);
            };
        }, [employeeId, queryClient]);
    };

    return {
        useConversations,
        useMessages,
        useSendMessage,
        useDeleteConversation,
        useMarkAsRead,
        useTotalUnreadCount,
        usePresence,
        useGlobalChatSync,
        useUploadAttachment,
        subscribeToConversation,
    };
}
