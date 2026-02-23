import { MainLayout } from '@/components/layout/MainLayout';

export default function LeaveCalendar() {
    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Leave Calendar</h1>
                    <p className="text-muted-foreground">View organization-wide leave schedule.</p>
                </div>
                <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Leave calendar functionality coming soon.</p>
                </div>
            </div>
        </MainLayout>
    );
}
