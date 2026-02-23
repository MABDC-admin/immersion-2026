import { MainLayout } from '@/components/layout/MainLayout';
import { useOnboardingChecklists } from '@/hooks/useOnboarding';
import { useEmployeeDocuments } from '@/hooks/useEmployees';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const requiredDocuments = [
    'Government-issued ID',
    'Tax Form (TIN)',
    'Employment Contract',
    'NDA (Non-Disclosure Agreement)',
    'Emergency Contact Form',
    'Bank Account Details',
];

export default function OnboardingDocuments() {
    const { data: checklists = [], isLoading } = useOnboardingChecklists();

    const activeChecklists = checklists.filter(c => c.status === 'in_progress');

    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Onboarding Documents</h1>
                    <p className="text-muted-foreground">Track required documents for new hires.</p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : activeChecklists.length === 0 ? (
                    <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No active onboarding processes.</p>
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    {requiredDocuments.map(doc => (
                                        <TableHead key={doc} className="text-center text-xs">{doc}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeChecklists.map(checklist => (
                                    <TableRow key={checklist.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarFallback>{checklist.employee?.first_name?.[0]}{checklist.employee?.last_name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-sm">{checklist.employee?.first_name} {checklist.employee?.last_name}</span>
                                            </div>
                                        </TableCell>
                                        {requiredDocuments.map(doc => {
                                            const item = checklist.items?.find(i => i.title.toLowerCase().includes(doc.toLowerCase()));
                                            return (
                                                <TableCell key={doc} className="text-center">
                                                    {item?.is_completed ? (
                                                        <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
