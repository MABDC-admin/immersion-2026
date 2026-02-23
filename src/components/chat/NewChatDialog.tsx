import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEmployees } from '@/hooks/useEmployees';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NewChatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentEmployeeId: string;
    onConversationCreated: (id: string) => void;
}

export function NewChatDialog({ open, onOpenChange, currentEmployeeId, onConversationCreated }: NewChatDialogProps) {
    const { data: employees, isLoading } = useEmployees();
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const filteredEmployees = employees?.filter(emp =>
        emp.id !== currentEmployeeId &&
        (emp.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleCreateChat = async (targetEmployeeId: string) => {
        setIsCreating(true);
        try {
            const { data: convId, error } = await supabase
                .rpc('create_direct_conversation', {
                    creator_id: currentEmployeeId,
                    target_id: targetEmployeeId
                });

            if (error) throw error;

            onConversationCreated(convId);
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl font-bold">New Chat</DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search employees..."
                            className="pl-9 rounded-full bg-muted/50 border-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : (
                            filteredEmployees?.map((emp) => (
                                <div
                                    key={emp.id}
                                    className="flex items-center justify-between p-2 rounded-xl hover:bg-accent transition-colors cursor-pointer group"
                                    onClick={() => handleCreateChat(emp.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={emp.avatar_url} />
                                            <AvatarFallback>{emp.first_name[0]}{emp.last_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-semibold">{emp.first_name} {emp.last_name}</p>
                                            <p className="text-xs text-muted-foreground">{emp.job_title || 'Employee'}</p>
                                        </div>
                                    </div>
                                    <UserPlus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))
                        )}
                        {filteredEmployees?.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No colleagues found.
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
