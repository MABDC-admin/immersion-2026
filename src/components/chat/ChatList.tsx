import React from 'react';
import { ChatConversation } from '@/types/chat';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

interface ChatListProps {
    conversations: ChatConversation[];
    isLoading: boolean;
    selectedId: string | null;
    currentEmployeeId: string;
    onSelect: (id: string) => void;
}

function getConversationDisplay(conv: ChatConversation, currentEmployeeId: string) {
    if (conv.type === 'group') {
        const title = conv.title || 'Group Chat';
        const initials = title.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
        return { title, initials, avatarUrl: undefined, isGroup: true, memberCount: conv.members?.length || 0 };
    }

    const otherMember = conv.members?.find(m => m.employee_id !== currentEmployeeId)?.employee;
    const title = otherMember ? `${otherMember.first_name} ${otherMember.last_name}` : 'Unknown Chat';
    const initials = title.split(' ').map(n => n[0]).join('').toUpperCase();
    return { title, initials, avatarUrl: otherMember?.avatar_url, isGroup: false, memberCount: 0 };
}

export function ChatList({ conversations, isLoading, selectedId, currentEmployeeId, onSelect }: ChatListProps) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2 overflow-y-auto h-full pr-2 custom-scrollbar">
            {conversations.map((conv) => {
                const display = getConversationDisplay(conv, currentEmployeeId);

                return (
                    <Card
                        key={conv.id}
                        className={cn(
                            "cursor-pointer border-none shadow-none hover:bg-accent/50 transition-colors rounded-xl",
                            selectedId === conv.id ? "bg-accent" : "bg-transparent"
                        )}
                        onClick={() => onSelect(conv.id)}
                    >
                        <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 ring-2 ring-primary/5">
                                    {display.isGroup ? (
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            <Users className="h-5 w-5" />
                                        </AvatarFallback>
                                    ) : (
                                        <>
                                            <AvatarImage src={display.avatarUrl} />
                                            <AvatarFallback>{display.initials}</AvatarFallback>
                                        </>
                                    )}
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <h4 className="font-semibold text-sm truncate">{display.title}</h4>
                                        <span className="text-[10px] text-muted-foreground">
                                            {format(new Date(conv.updated_at), 'hh:mm a')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {display.isGroup
                                            ? `${display.memberCount} members`
                                            : (conv.last_message?.content || 'No messages yet')
                                        }
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}

            {conversations.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-xs text-muted-foreground">No conversations found</p>
                </div>
            )}
        </div>
    );
}
