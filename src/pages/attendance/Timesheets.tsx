import { MainLayout } from '@/components/layout/MainLayout';

export default function Timesheets() {
    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Timesheets</h1>
                    <p className="text-muted-foreground">Manage employee weekly timesheets.</p>
                </div>
                <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Timesheet management functionality coming soon.</p>
                </div>
            </div>
        </MainLayout>
    );
}
