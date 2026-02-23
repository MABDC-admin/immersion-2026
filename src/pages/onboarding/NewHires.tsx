import { MainLayout } from '@/components/layout/MainLayout';

export default function NewHires() {
    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">New Hires</h1>
                    <p className="text-muted-foreground">Manage and track onboarding for new employees.</p>
                </div>
                <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">New Hires management functionality coming soon.</p>
                </div>
            </div>
        </MainLayout>
    );
}
