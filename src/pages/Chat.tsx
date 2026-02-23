import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { useChat } from '@/hooks/useChat';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { NewChatDialog } from '@/components/chat/NewChatDialog';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';

export default function ChatPage() {
    const { user } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');
    const { useConversations } = useChat();
    const { data: conversations = [], isLoading, refetch } = useConversations(employee?.id || '');
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);

    return (
        <MainLayout>
            <div className="flex h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] gap-4 animate-fade-in mb-8 md:mb-0">
                {/* Conversation List */}
                <div className={`${selectedConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col gap-4`}>
                    <div className="flex items-center justify-between px-1">
                        <h1 className="text-2xl font-bold">Messages</h1>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-full"
                            onClick={() => setIsNewChatOpen(true)}
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <ChatList
                            conversations={conversations}
                            isLoading={isLoading}
                            selectedId={selectedConversationId}
                            onSelect={setSelectedConversationId}
                        />
                    </div>
                </div>

                {/* Chat Window */}
                <div className={`${selectedConversationId ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full bg-card rounded-2xl border shadow-sm overflow-hidden`}>
                    {selectedConversationId ? (
                        <ChatWindow
                            conversationId={selectedConversationId}
                            employeeId={employee?.id || ''}
                            onBack={() => setSelectedConversationId(null)}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                            <div className="p-6 rounded-full bg-primary/10 text-primary">
                                <MessageSquare className="h-12 w-12" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Your Conversations</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto">
                                    Select a message to start chatting with your colleagues or HR support.
                                </p>
                            </div>
                            <Button className="rounded-full px-6" onClick={() => setIsNewChatOpen(true)}>New Conversation</Button>
                        </div>
                    )}
                </div>

                <NewChatDialog
                    open={isNewChatOpen}
                    onOpenChange={setIsNewChatOpen}
                    currentEmployeeId={employee?.id || ''}
                    onConversationCreated={(id) => {
                        setSelectedConversationId(id);
                        refetch();
                    }}
                />
            </div>
        </MainLayout>
    );
}
