import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEmployees } from '@/hooks/useEmployees';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Loader2, Users, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NewGroupChatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentEmployeeId: string;
    onConversationCreated: (id: string) => void;
}

export function NewGroupChatDialog({ open, onOpenChange, currentEmployeeId, onConversationCreated }: NewGroupChatDialogProps) {
    const { data: employees, isLoading } = useEmployees();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const filteredEmployees = employees?.filter(emp =>
        emp.id !== currentEmployeeId &&
        (emp.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const selectedEmployees = employees?.filter(emp => selectedMembers.includes(emp.id)) || [];

    const toggleMember = (id: string) => {
        setSelectedMembers(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const handleCreate = async () => {
        if (!currentEmployeeId) {
            toast.error('Unable to identify your account. Please try again.');
            return;
        }
        if (selectedMembers.length < 2) {
            toast.error('Select at least 2 members for a group chat');
            return;
        }

        setIsCreating(true);
        try {
            const { data: convId, error } = await supabase
                .rpc('create_group_conversation', {
                    creator_id: currentEmployeeId,
                    member_ids: selectedMembers,
                    group_title: groupName.trim() || null,
                });

            if (error) throw error;

            onConversationCreated(convId);
            onOpenChange(false);
            setSelectedMembers([]);
            setGroupName('');
            setSearchQuery('');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = (val: boolean) => {
        if (!val) {
            setSelectedMembers([]);
            setGroupName('');
            setSearchQuery('');
        }
        onOpenChange(val);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Users className="h-5 w-5" /> New Group Chat
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    {/* Group Name */}
                    <Input
                        placeholder="Group name (optional)"
                        className="rounded-full bg-muted/50 border-none pl-4"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                    />

                    {/* Selected Members */}
                    {selectedMembers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {selectedEmployees.map((emp) => (
                                <Badge
                                    key={emp.id}
                                    variant="secondary"
                                    className="pl-1 pr-1.5 py-1 gap-1 rounded-full cursor-pointer hover:bg-destructive/10 transition-colors"
                                    onClick={() => toggleMember(emp.id)}
                                >
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage src={emp.avatar_url} />
                                        <AvatarFallback className="text-[8px]">{emp.first_name[0]}{emp.last_name[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs">{emp.first_name}</span>
                                    <X className="h-3 w-3 text-muted-foreground" />
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search employees..."
                            className="pl-9 rounded-full bg-muted/50 border-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Employee List */}
                    <div className="max-h-60 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : (
                            filteredEmployees?.map((emp) => {
                                const isSelected = selectedMembers.includes(emp.id);
                                return (
                                    <div
                                        key={emp.id}
                                        className={cn(
                                            "flex items-center justify-between p-2 rounded-xl hover:bg-accent transition-colors cursor-pointer",
                                            isSelected && "bg-primary/5"
                                        )}
                                        onClick={() => toggleMember(emp.id)}
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
                                        <div className={cn(
                                            "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                            isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                        )}>
                                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {filteredEmployees?.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No colleagues found.
                            </div>
                        )}
                    </div>

                    {/* Create Button */}
                    <Button
                        className="w-full rounded-full"
                        onClick={handleCreate}
                        disabled={selectedMembers.length < 2 || isCreating}
                    >
                        {isCreating ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Users className="h-4 w-4 mr-2" />
                        )}
                        Create Group ({selectedMembers.length} members)
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
