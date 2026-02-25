import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
    useOnboardingChecklists, useCreateChecklist, useDeleteChecklist,
    useUpdateOnboardingStatus, useToggleOnboardingItem,
    useCreateOnboardingItem, useDeleteOnboardingItem,
} from '@/hooks/useOnboarding';
import { useEmployees } from '@/hooks/useEmployees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Plus, Trash2, ChevronDown, CheckCircle, Loader2, ListChecks, ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function Checklists() {
    const { data: checklists = [], isLoading } = useOnboardingChecklists();
    const { data: employees = [] } = useEmployees();
    const createChecklist = useCreateChecklist();
    const deleteChecklist = useDeleteChecklist();
    const updateStatus = useUpdateOnboardingStatus();
    const toggleItem = useToggleOnboardingItem();
    const createItem = useCreateOnboardingItem();
    const deleteItem = useDeleteOnboardingItem();
    const { toast } = useToast();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newEmployeeId, setNewEmployeeId] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [newItemTitle, setNewItemTitle] = useState('');
    const [addingItemTo, setAddingItemTo] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!newTitle.trim() || !newEmployeeId) {
            toast({ title: 'Please fill in all fields', variant: 'destructive' });
            return;
        }
        try {
            await createChecklist.mutateAsync({ employee_id: newEmployeeId, title: newTitle.trim() });
            setIsCreateOpen(false);
            setNewTitle('');
            setNewEmployeeId('');
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteChecklist.mutateAsync(id);
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    const handleMarkComplete = async (id: string) => {
        try {
            await updateStatus.mutateAsync({ id, status: 'completed' });
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    const handleReopen = async (id: string) => {
        try {
            await updateStatus.mutateAsync({ id, status: 'in_progress' });
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    const handleToggleItem = async (id: string, current: boolean) => {
        try {
            await toggleItem.mutateAsync({ id, isCompleted: !current });
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    const handleAddItem = async (checklistId: string) => {
        if (!newItemTitle.trim()) return;
        try {
            await createItem.mutateAsync({ checklist_id: checklistId, title: newItemTitle.trim() });
            setNewItemTitle('');
            setAddingItemTo(null);
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    const handleDeleteItem = async (id: string) => {
        try {
            await deleteItem.mutateAsync(id);
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    const calculateProgress = (items: any[] = []) => {
        if (items.length === 0) return 0;
        return Math.round((items.filter(i => i.is_completed).length / items.length) * 100);
    };

    // Stats
    const totalChecklists = checklists.length;
    const completedCount = checklists.filter(c => c.status === 'completed').length;
    const inProgressCount = checklists.filter(c => c.status === 'in_progress').length;

    return (
        <MainLayout onAddNew={() => setIsCreateOpen(true)}>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">Onboarding Checklists</h1>
                        <p className="text-sm text-muted-foreground">Manage onboarding progress for new hires.</p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Checklist
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <Card className="shadow-sm">
                        <CardContent className="p-3 flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-primary/10"><ClipboardList className="h-4 w-4 text-primary" /></div>
                            <div>
                                <p className="text-lg font-bold">{totalChecklists}</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-bold">Total</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardContent className="p-3 flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-hrms-warning/10"><ListChecks className="h-4 w-4 text-hrms-warning" /></div>
                            <div>
                                <p className="text-lg font-bold">{inProgressCount}</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-bold">Active</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardContent className="p-3 flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-hrms-success/10"><CheckCircle className="h-4 w-4 text-hrms-success" /></div>
                            <div>
                                <p className="text-lg font-bold">{completedCount}</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-bold">Done</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Checklists */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : checklists.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <ClipboardList className="h-8 w-8 text-muted-foreground mb-3" />
                            <h3 className="text-lg font-semibold mb-1">No Checklists</h3>
                            <p className="text-sm text-muted-foreground mb-4">Create an onboarding checklist for a new hire.</p>
                            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                                <Plus className="h-4 w-4" />Create Checklist
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {checklists.map(checklist => {
                            const progress = calculateProgress(checklist.items);
                            const isExpanded = expandedId === checklist.id;
                            const isCompleted = checklist.status === 'completed';
                            const allDone = checklist.items?.length ? checklist.items.every(i => i.is_completed) : false;

                            return (
                                <Card key={checklist.id} className={cn("shadow-sm transition-all", isCompleted && "opacity-75")}>
                                    <Collapsible open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : checklist.id)}>
                                        <CardContent className="p-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                                {/* Employee + title */}
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <Avatar className="h-9 w-9 shrink-0">
                                                        <AvatarImage src={checklist.employee?.avatar_url || ''} />
                                                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                            {checklist.employee?.first_name?.[0]}{checklist.employee?.last_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-sm truncate">{checklist.title}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate">
                                                            {checklist.employee?.first_name} {checklist.employee?.last_name}
                                                            {' • '}{checklist.items?.length || 0} items
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Progress + status */}
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-muted-foreground">
                                                                {checklist.items?.filter(i => i.is_completed).length || 0}/{checklist.items?.length || 0}
                                                            </span>
                                                            <span className="font-bold">{progress}%</span>
                                                        </div>
                                                        <Progress value={progress} className="h-2" />
                                                    </div>
                                                    <Badge className={cn(
                                                        "text-[8px] font-bold uppercase shrink-0",
                                                        isCompleted ? "bg-hrms-success/10 text-hrms-success" : "bg-primary/10 text-primary"
                                                    )}>
                                                        {isCompleted ? 'Completed' : 'In Progress'}
                                                    </Badge>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {!isCompleted && allDone && checklist.items?.length ? (
                                                        <Button variant="default" size="sm" className="text-xs gap-1 h-8" onClick={(e) => { e.stopPropagation(); handleMarkComplete(checklist.id); }}>
                                                            <CheckCircle className="h-3 w-3" />Complete
                                                        </Button>
                                                    ) : isCompleted ? (
                                                        <Button variant="outline" size="sm" className="text-xs h-8" onClick={(e) => { e.stopPropagation(); handleReopen(checklist.id); }}>
                                                            Reopen
                                                        </Button>
                                                    ) : null}
                                                    <Button variant="ghost" size="sm" className="text-destructive h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleDelete(checklist.id); }}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <CollapsibleTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                                                        </Button>
                                                    </CollapsibleTrigger>
                                                </div>
                                            </div>
                                        </CardContent>

                                        <CollapsibleContent>
                                            <div className="border-t px-4 py-3 space-y-2 bg-muted/20">
                                                {checklist.items?.map(item => (
                                                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors group">
                                                        <Checkbox
                                                            checked={item.is_completed}
                                                            onCheckedChange={() => handleToggleItem(item.id, item.is_completed)}
                                                            className="shrink-0"
                                                        />
                                                        <span className={cn("text-sm flex-1", item.is_completed && "line-through text-muted-foreground")}>
                                                            {item.title}
                                                        </span>
                                                        {item.description && (
                                                            <span className="text-[10px] text-muted-foreground hidden sm:inline truncate max-w-[200px]">{item.description}</span>
                                                        )}
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            className="h-6 w-6 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                            onClick={() => handleDeleteItem(item.id)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}

                                                {(checklist.items?.length === 0 || !checklist.items) && (
                                                    <p className="text-sm text-muted-foreground text-center py-2">No items yet — add one below.</p>
                                                )}

                                                {/* Add item */}
                                                {addingItemTo === checklist.id ? (
                                                    <div className="flex gap-2 pt-1">
                                                        <Input
                                                            placeholder="Item title..."
                                                            value={newItemTitle}
                                                            onChange={e => setNewItemTitle(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && handleAddItem(checklist.id)}
                                                            className="flex-1 h-8 text-sm"
                                                            autoFocus
                                                        />
                                                        <Button size="sm" className="h-8 text-xs" onClick={() => handleAddItem(checklist.id)}>Add</Button>
                                                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setAddingItemTo(null); setNewItemTitle(''); }}>Cancel</Button>
                                                    </div>
                                                ) : (
                                                    <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground w-full justify-center" onClick={() => setAddingItemTo(checklist.id)}>
                                                        <Plus className="h-3 w-3" />Add Item
                                                    </Button>
                                                )}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Checklist Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md w-[95vw]">
                    <DialogHeader>
                        <DialogTitle>New Onboarding Checklist</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Employee *</Label>
                            <Select value={newEmployeeId} onValueChange={setNewEmployeeId}>
                                <SelectTrigger><SelectValue placeholder="Select employee..." /></SelectTrigger>
                                <SelectContent>
                                    {employees.map(e => (
                                        <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Checklist Title *</Label>
                            <Input placeholder="e.g. Standard Onboarding" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={createChecklist.isPending}>
                            {createChecklist.isPending ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
