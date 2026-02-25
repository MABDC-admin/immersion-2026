import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Paperclip, Send, Phone, PhoneOff, Mic, MicOff, MoreVertical, ChevronLeft, Image, Video, FileText, Loader2, X, ArrowLeft, MoreHorizontal, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useChat } from '@/hooks/useChat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ActiveCallOverlay } from './ActiveCallOverlay';
import { CallStatus } from '@/hooks/useVoiceCall';
import { ChatMessage, ChatConversation } from '@/types/chat';

interface ChatWindowProps {
    conversationId: string;
    employeeId: string;
    onBack?: () => void;
    callState?: {
        status: CallStatus;
        remoteEmployeeId: string | null;
        conversationId: string | null;
        isMuted: boolean;
        callDuration: number;
    };
    onInitiateCall?: (remoteEmployeeId: string) => void;
    onEndCall?: () => void;
    onToggleMute?: () => void;
    onlineEmployeeIds?: Set<string>;
    typingUsers?: Record<string, Set<string>>;
    setTyping?: (convId: string | null) => Promise<void>;
}

export function ChatWindow({ conversationId, employeeId, onBack, callState, onInitiateCall, onEndCall, onToggleMute, onlineEmployeeIds, typingUsers, setTyping }: ChatWindowProps) {
    const { useMessages, useSendMessage, subscribeToConversation, useConversations, useMarkAsRead, useUploadAttachment } = useChat();
    const { data: messages = [], isLoading } = useMessages(conversationId);
    const { data: conversations = [] } = useConversations(employeeId);
    const markAsRead = useMarkAsRead();
    const sendMessage = useSendMessage();
    const uploadAttachment = useUploadAttachment();
    const [newMessage, setNewMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const conversation = conversations.find((c) => c.id === conversationId);
    const isGroup = conversation?.type === 'group';

    // For direct chats
    const otherMember = conversation?.members?.find((m) => m.employee_id !== employeeId)?.employee;

    // Display info
    const displayName = isGroup
        ? (conversation?.title || 'Group Chat')
        : (otherMember ? `${otherMember.first_name} ${otherMember.last_name}` : 'Chat Session');
    const displayInitials = displayName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
    const memberCount = conversation?.members?.length || 0;

    const isInCall = callState && callState.conversationId === conversationId &&
        (callState.status === 'calling' || callState.status === 'connected');

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

    // Auto-scroll to bottom and mark as read
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
        if (conversationId && employeeId) {
            markAsRead.mutate({ conversationId, employeeId });
        }
    }, [messages, conversationId, employeeId]);

    // Typing indicator handling
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if (setTyping && conversationId) {
            setTyping(conversationId);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                setTyping(null);
            }, 3000);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !conversationId) return;

        sendMessage.mutate({
            conversation_id: conversationId,
            sender_id: employeeId,
            content: newMessage.trim(),
            type: 'text'
        });
        setNewMessage('');
        if (setTyping) setTyping(null);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0 || !conversationId) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const uploadedFiles = await Promise.all(files.map(async (file, index) => {
                const attachment = await uploadAttachment.mutateAsync({ conversationId, file });
                setUploadProgress(Math.round(((index + 1) / files.length) * 100));
                return {
                    file_path: attachment.path,
                    file_name: attachment.name,
                    file_type: attachment.type,
                    file_size: file.size,
                    original_file: file
                };
            }));

            const images = uploadedFiles.filter(f => f.original_file.type.startsWith('image/'));
            const videos = uploadedFiles.filter(f => f.original_file.type.startsWith('video/'));
            const docs = uploadedFiles.filter(f => !f.original_file.type.startsWith('image/') && !f.original_file.type.startsWith('video/'));

            // Group images into a gallery if more than 1
            if (images.length === 1) {
                sendMessage.mutate({
                    conversation_id: conversationId,
                    sender_id: employeeId,
                    content: `Sent an image`,
                    type: 'image',
                    metadata: {
                        file_path: images[0].file_path,
                        file_name: images[0].file_name,
                        file_type: images[0].file_type,
                        file_size: images[0].file_size
                    }
                });
            } else if (images.length > 1) {
                sendMessage.mutate({
                    conversation_id: conversationId,
                    sender_id: employeeId,
                    content: `Sent ${images.length} images`,
                    type: 'gallery',
                    metadata: {
                        images: images.map(img => ({
                            file_path: img.file_path,
                            file_name: img.file_name,
                            file_type: img.file_type,
                            file_size: img.file_size
                        }))
                    }
                });
            }

            videos.forEach(vid => {
                sendMessage.mutate({
                    conversation_id: conversationId,
                    sender_id: employeeId,
                    content: `Sent a video`,
                    type: 'video',
                    metadata: {
                        file_path: vid.file_path,
                        file_name: vid.file_name,
                        file_type: vid.file_type,
                        file_size: vid.file_size
                    }
                });
            });

            docs.forEach(doc => {
                sendMessage.mutate({
                    conversation_id: conversationId,
                    sender_id: employeeId,
                    content: `Sent a file`,
                    type: 'file',
                    metadata: {
                        file_path: doc.file_path,
                        file_name: doc.file_name,
                        file_type: doc.file_type,
                        file_size: doc.file_size
                    }
                });
            });

            toast.success(`Succesfully uploaded ${files.length} files`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload files');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleCall = () => {
        if (otherMember && onInitiateCall && !isGroup) {
            onInitiateCall(otherMember.id);
        }
    };

    // Build a map of sender names for group display
    const memberMap = new Map<string, { first_name: string; last_name: string; avatar_url?: string }>();
    conversation?.members?.forEach((m) => {
        if (m.employee) {
            memberMap.set(m.employee_id, m.employee);
        }
    });

    return (
        <div className="flex flex-col h-full relative">
            {/* Call Overlay */}
            {isInCall && callState && onEndCall && onToggleMute && (
                <ActiveCallOverlay
                    status={callState.status}
                    remoteName={displayName}
                    remoteAvatar={otherMember?.avatar_url}
                    isMuted={callState.isMuted}
                    callDuration={callState.callDuration}
                    onEndCall={onEndCall}
                    onToggleMute={onToggleMute}
                />
            )}

            {/* Window Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-10 w-10">
                        {isGroup ? (
                            <AvatarFallback className="bg-primary/10 text-primary">
                                <Users className="h-4 w-4" />
                            </AvatarFallback>
                        ) : (
                            <>
                                <AvatarImage src={otherMember?.avatar_url} />
                                <AvatarFallback>{displayInitials}</AvatarFallback>
                            </>
                        )}
                    </Avatar>
                    <div>
                        <h4 className="text-sm font-bold">{displayName}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                            {isGroup ? (
                                `${memberCount} members`
                            ) : (
                                <>
                                    {onlineEmployeeIds?.has(otherMember?.id || '') ? (
                                        <>
                                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-green-500">Online</span>
                                        </>
                                    ) : (
                                        'Offline'
                                    )}
                                    {typingUsers?.[conversationId]?.size > 0 && (
                                        <>
                                            <span className="mx-1">•</span>
                                            <span className="text-primary animate-pulse italic">typing...</span>
                                        </>
                                    )}
                                    {isInCall && ' • In call'}
                                </>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {!isGroup && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={handleCall}
                            disabled={!otherMember || isInCall}
                        >
                            <Phone className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Messages Area with WhatsApp-style Background */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 relative custom-scrollbar"
                style={{
                    backgroundColor: '#e5ddd5',
                    backgroundImage: `url("https://wweb.dev/assets/whatsapp-chat-background.png")`,
                    backgroundSize: '400px',
                    backgroundRepeat: 'repeat',
                    backgroundAttachment: 'local'
                }}
            >
                {/* Overlay to soften the pattern */}
                <div className="absolute inset-0 bg-[#e5ddd5]/40 pointer-events-none" />

                <div className="relative z-10 space-y-4">
                    {messages.map((msg) => {
                        const isOwn = msg.sender_id === employeeId;
                        const senderInfo = memberMap.get(msg.sender_id);
                        const senderName = senderInfo ? `${senderInfo.first_name}` : '';

                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex flex-col max-w-[80%]",
                                    isOwn ? "ml-auto items-end" : "items-start"
                                )}
                            >
                                {isGroup && !isOwn && senderName && (
                                    <span className="text-[10px] text-primary font-semibold mb-0.5 px-1">
                                        {senderName}
                                    </span>
                                )}
                                <div className={cn(
                                    "px-1.5 py-1.5 rounded-2xl text-sm shadow-sm transition-all overflow-hidden",
                                    isOwn
                                        ? "bg-[#dcf8c6] text-foreground rounded-tr-none border border-[#c0e0a8]"
                                        : "bg-card text-foreground rounded-tl-none border border-muted/20"
                                )}>
                                    {msg.type === 'image' && msg.metadata?.file_path && (
                                        <div className="rounded-xl overflow-hidden bg-black/5 group relative max-w-[280px]">
                                            <img
                                                src={supabase.storage.from('chat-attachments').getPublicUrl(msg.metadata.file_path).data.publicUrl}
                                                alt={msg.metadata.file_name}
                                                className="w-full h-auto min-h-[100px] object-cover cursor-pointer transition-transform hover:scale-[1.02]"
                                                onClick={() => setPreviewImage(supabase.storage.from('chat-attachments').getPublicUrl(msg.metadata.file_path).data.publicUrl)}
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                                                <Image className="h-8 w-8 text-white/70" />
                                            </div>
                                        </div>
                                    )}
                                    {msg.type === 'gallery' && msg.metadata?.images && (
                                        <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden max-w-[280px]">
                                            {msg.metadata.images.map((img: any, i: number) => (
                                                <div key={i} className="relative group aspect-square bg-black/5">
                                                    <img
                                                        src={supabase.storage.from('chat-attachments').getPublicUrl(img.file_path).data.publicUrl}
                                                        alt={img.file_name}
                                                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={() => setPreviewImage(supabase.storage.from('chat-attachments').getPublicUrl(img.file_path).data.publicUrl)}
                                                    />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                                                        <Image className="h-6 w-6 text-white/70" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {msg.type === 'video' && msg.metadata?.file_path && (
                                        <div className="rounded-xl overflow-hidden bg-black/5 max-w-[280px]">
                                            <video
                                                controls
                                                className="w-full rounded-lg"
                                                src={supabase.storage.from('chat-attachments').getPublicUrl(msg.metadata.file_path).data.publicUrl}
                                            />
                                        </div>
                                    )}
                                    {msg.type === 'file' && msg.metadata?.file_path && (
                                        <div
                                            className="flex items-center gap-3 p-2 rounded-xl bg-black/5 border border-muted/5 cursor-pointer hover:bg-black/10 transition-colors min-w-[200px] max-w-[280px]"
                                            onClick={() => window.open(supabase.storage.from('chat-attachments').getPublicUrl(msg.metadata.file_path).data.publicUrl, '_blank')}
                                        >
                                            <div className="flex-shrink-0 p-3 rounded-lg bg-white shadow-sm ring-1 ring-black/5">
                                                <FileText className="h-7 w-7 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-2">
                                                <p className="text-[11px] font-bold text-foreground truncate">{msg.metadata.file_name}</p>
                                                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                                                    {(msg.metadata.file_size / (1024 * 1024)).toFixed(2)} MB • {msg.metadata.file_type?.split('/').pop() || 'FILE'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {msg.content && msg.type === 'text' && (
                                        <div className="px-2 py-1 max-w-[280px] break-words">
                                            {msg.content}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                    {format(new Date(msg.created_at), 'hh:mm a')}
                                </span>
                            </div>
                        );
                    })}
                    {messages.length === 0 && !isLoading && (
                        <div className="h-full flex flex-col items-center justify-center space-y-2 opacity-50 relative z-10">
                            <p className="text-xs">No messages yet. Say hello!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background/80 backdrop-blur-sm border-t relative z-20">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                        multiple
                    />
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="rounded-full flex-shrink-0 relative"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] text-white font-bold">
                                    {uploadProgress}%
                                </span>
                            </>
                        ) : (
                            <Paperclip className="h-5 w-5" />
                        )}
                    </Button>
                    <input
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder="Type a message..."
                        className="flex-1 bg-muted/30 border-none rounded-full px-4 py-2 focus:ring-1 focus:ring-primary text-sm"
                        disabled={isUploading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="rounded-full bg-primary hover:bg-primary/90 flex-shrink-0"
                        disabled={!newMessage.trim() && !isUploading}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewImage(null)}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full h-10 w-10 z-50"
                        onClick={() => setPreviewImage(null)}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                    <img
                        src={previewImage}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain drop-shadow-2xl animate-in zoom-in-95 duration-200"
                    />
                </div>
            )}
        </div>
    );
}
