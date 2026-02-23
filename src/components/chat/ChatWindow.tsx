import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChat } from '@/hooks/useChat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Phone, Video, Info, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatWindowProps {
    conversationId: string;
    employeeId: string;
    onBack?: () => void;
}

export function ChatWindow({ conversationId, employeeId, onBack }: ChatWindowProps) {
    const { useMessages, useSendMessage, subscribeToConversation } = useChat();
    const { data: messages = [], isLoading } = useMessages(conversationId);
    const sendMessage = useSendMessage();
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // Subscribe to realtime updates
    useEffect(() => {
        if (!conversationId) return;

        const unsubscribe = subscribeToConversation(conversationId, (newMsg) => {
            queryClient.setQueryData(['chat', 'messages', conversationId], (old: any) => {
                const exists = old?.some((m: any) => m.id === newMsg.id);
                if (exists) return old;
                return [...(old || []), newMsg];
            });
        });

        return () => unsubscribe();
    }, [conversationId, queryClient]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!newMessage.trim()) return;

        sendMessage.mutate({
            conversation_id: conversationId,
            content: newMessage,
            sender_id: employeeId
        });
        setNewMessage('');
    };

    return (
        <div className="flex flex-col h-full">
            {/* Window Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-10 w-10">
                        <AvatarFallback>CH</AvatarFallback>
                    </Avatar>
                    <div>
                        <h4 className="text-sm font-bold">Chat Session</h4>
                        <p className="text-[10px] text-hrms-success font-medium">Online</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5 custom-scrollbar"
            >
                {messages.map((msg) => {
                    const isOwn = msg.sender_id === employeeId;
                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex flex-col max-w-[80%]",
                                isOwn ? "ml-auto items-end" : "items-start"
                            )}
                        >
                            <div className={cn(
                                "px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all",
                                isOwn
                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                    : "bg-card text-foreground rounded-tl-none border border-muted/20"
                            )}>
                                {msg.content}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                {format(new Date(msg.created_at), 'hh:mm a')}
                            </span>
                        </div>
                    );
                })}
                {messages.length === 0 && !isLoading && (
                    <div className="h-full flex flex-col items-center justify-center space-y-2 opacity-50">
                        <p className="text-xs">No messages yet. Say hello!</p>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-card">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        className="rounded-full bg-muted/50 border-none focus-visible:ring-primary pl-4"
                    />
                    <Button
                        size="icon"
                        className="rounded-full h-10 w-10 shrink-0"
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sendMessage.isPending}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
