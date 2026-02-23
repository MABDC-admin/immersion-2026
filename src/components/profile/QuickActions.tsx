import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Square, CalendarPlus, UserEdit, FileText } from 'lucide-react';

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
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
                {!isClockedIn ? (
                    <Button
                        className="flex flex-col h-auto py-4 gap-2 bg-hrms-success hover:bg-hrms-success/90"
                        onClick={onClockIn}
                        disabled={isClocking}
                    >
                        <Play className="h-5 w-5" />
                        <span>Clock In</span>
                    </Button>
                ) : (
                    <Button
                        variant="destructive"
                        className="flex flex-col h-auto py-4 gap-2"
                        onClick={onClockOut}
                        disabled={isClocking}
                    >
                        <Square className="h-5 w-5" />
                        <span>Clock Out</span>
                    </Button>
                )}
                <Button
                    variant="outline"
                    className="flex flex-col h-auto py-4 gap-2 border-hrms-warning text-hrms-warning hover:bg-hrms-warning/10"
                    onClick={onRequestLeave}
                >
                    <CalendarPlus className="h-5 w-5" />
                    <span>Request Leave</span>
                </Button>
                <Button
                    variant="outline"
                    className="flex flex-col h-auto py-4 gap-2 border-primary text-primary hover:bg-primary/10"
                    onClick={onUpdateProfile}
                >
                    <UserEdit className="h-5 w-5" />
                    <span>Update Profile</span>
                </Button>
                <Button
                    variant="secondary"
                    className="flex flex-col h-auto py-4 gap-2"
                >
                    <FileText className="h-5 w-5" />
                    <span>View Payslip</span>
                </Button>
            </CardContent>
        </Card>
    );
}
