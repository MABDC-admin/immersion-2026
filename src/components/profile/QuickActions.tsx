import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Square, CalendarPlus, UserPen, FileText } from 'lucide-react';

interface QuickActionsProps {
    onClockIn: () => void;
    onClockOut: () => void;
    onRequestLeave: () => void;
    onUpdateProfile: () => void;
    isClockedIn: boolean;
    isClocking: boolean;
}

export function QuickActions({
    onClockIn,
    onClockOut,
    onRequestLeave,
    onUpdateProfile,
    isClockedIn,
    isClocking
}: QuickActionsProps) {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-l-4 border-l-hrms-success">
            <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                {!isClockedIn ? (
                    <Button
                        className="flex flex-col h-auto py-6 gap-3 bg-hrms-success hover:bg-hrms-success/90 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 font-semibold active:scale-95"
                        onClick={onClockIn}
                        disabled={isClocking}
                    >
                        <Play className="h-6 w-6 stroke-[2.5px]" />
                        <span>Clock In</span>
                    </Button>
                ) : (
                    <Button
                        variant="destructive"
                        className="flex flex-col h-auto py-6 gap-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 font-semibold active:scale-95"
                        onClick={onClockOut}
                        disabled={isClocking}
                    >
                        <Square className="h-6 w-6 fill-current stroke-[2.5px]" />
                        <span>Clock Out</span>
                    </Button>
                )}
                <Button
                    variant="outline"
                    className="flex flex-col h-auto py-6 gap-3 border-hrms-warning text-hrms-warning hover:bg-hrms-warning/10 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 font-semibold active:scale-95"
                    onClick={onRequestLeave}
                >
                    <CalendarPlus className="h-6 w-6 stroke-[2.5px]" />
                    <span>Request Leave</span>
                </Button>
                <Button
                    variant="outline"
                    className="flex flex-col h-auto py-6 gap-3 border-primary text-primary hover:bg-primary/10 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 font-semibold active:scale-95"
                    onClick={onUpdateProfile}
                >
                    <UserPen className="h-6 w-6 stroke-[2.5px]" />
                    <span>Update Profile</span>
                </Button>
                <Button
                    variant="secondary"
                    className="flex flex-col h-auto py-6 gap-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 font-semibold active:scale-95 bg-muted/50 border border-muted"
                >
                    <FileText className="h-6 w-6 stroke-[2.5px]" />
                    <span>View Payslip</span>
                </Button>
            </CardContent>
        </Card>
    );
}
