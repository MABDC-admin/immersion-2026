import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import {
    useEmployeeDocuments,
    useUploadDocument,
    useDeleteDocument,
    useDownloadDocument,
} from '@/hooks/useEmployees';
import { DocumentUpload } from '@/components/employees/DocumentUpload';

export default function MyDocuments() {
    const { user } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');
    const { data: documents = [] } = useEmployeeDocuments(employee?.id || '');
    const uploadDocument = useUploadDocument();
    const deleteDocument = useDeleteDocument();
    const downloadDocument = useDownloadDocument();

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">My Documents</h1>
                    <p className="text-sm text-muted-foreground">Upload and manage your OJT requirements and documents</p>
                </div>

                {/* Required Documents Guide */}
                <Card className="border-l-4 border-l-hrms-warning shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-hrms-warning" />
                            Required Documents
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                                'Memorandum of Agreement (MOA)',
                                'Parental Consent Form',
                                'Medical Certificate',
                                'Resume / CV',
                                'Student ID (Copy)',
                                'Barangay Clearance',
                                'Birth Certificate (Copy)',
                                'Insurance Certificate',
                            ].map((doc) => {
                                const hasDoc = documents.some((d) =>
                                    d.file_name.toLowerCase().includes(doc.split(' ')[0].toLowerCase())
                                );
                                return (
                                    <div
                                        key={doc}
                                        className="flex items-center gap-2 p-2 rounded-lg text-sm"
                                    >
                                        <div className={`h-2 w-2 rounded-full shrink-0 ${hasDoc ? 'bg-hrms-success' : 'bg-muted-foreground/30'}`} />
                                        <span className={hasDoc ? 'text-foreground' : 'text-muted-foreground'}>{doc}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Upload & Document List */}
                <Card className="border-l-4 border-l-primary shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold">Uploaded Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {employee ? (
                            <DocumentUpload
                                documents={documents}
                                onUpload={(file) => uploadDocument.mutate({ employeeId: employee.id, file })}
                                onDelete={(doc) =>
                                    deleteDocument.mutate({
                                        id: doc.id,
                                        filePath: doc.file_path,
                                        employeeId: employee.id,
                                    })
                                }
                                onDownload={(doc) =>
                                    downloadDocument.mutate({
                                        filePath: doc.file_path,
                                        fileName: doc.file_name,
                                    })
                                }
                                isUploading={uploadDocument.isPending}
                            />
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
