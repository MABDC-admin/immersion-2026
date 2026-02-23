import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Home,
    Clock,
    MessageSquare,
    GraduationCap,
    ChevronRight,
    ChevronLeft,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialStep {
    title: string;
    description: string;
    icon: React.ReactNode;
}

const steps: TutorialStep[] = [
    {
        title: "Welcome to HRMS 2026",
        description: "Let's take a quick tour of your new dashboard where you can manage your work and connect with colleagues.",
        icon: <Home className="h-10 w-10 text-primary" />,
    },
    {
        title: "Attendance & Time Tracking",
        description: "Easily clock in and out from the Attendance tab. You can also view your history and track your progress.",
        icon: <Clock className="h-10 w-10 text-hrms-success" />,
    },
    {
        title: "Collaborative Chat",
        description: "Connect with anyone in the company instantly. Start direct messages or join team group chats.",
        icon: <MessageSquare className="h-10 w-10 text-primary" />,
    },
    {
        title: "Training & Development",
        description: "Level up your skills with our built-in training courses. Track your progress and earn certifications.",
        icon: <GraduationCap className="h-10 w-10 text-hrms-warning" />,
    },
];

interface TutorialDialogProps {
    open: boolean;
    onClose: () => void;
}

export function TutorialDialog({ open, onClose }: TutorialDialogProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const isLastStep = currentStep === steps.length - 1;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-br from-primary/10 via-background to-background p-8 space-y-8">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="p-4 rounded-3xl bg-white shadow-lg ring-1 ring-primary/5 transition-transform duration-500 scale-110">
                            {steps[currentStep].icon}
                        </div>

                        <div className="space-y-2">
                            <DialogTitle className="text-2xl font-bold tracking-tight">
                                {steps[currentStep].title}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground leading-relaxed">
                                {steps[currentStep].description}
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="flex justify-center gap-2">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-300",
                                    i === currentStep ? "w-8 bg-primary" : "w-1.5 bg-primary/20"
                                )}
                            />
                        ))}
                    </div>

                    <DialogFooter className="flex sm:justify-between items-center bg-muted/30 -mx-8 -mb-8 p-6 mt-8">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className="text-muted-foreground hover:bg-transparent"
                        >
                            {currentStep > 0 && <ChevronLeft className="h-4 w-4 mr-1" />}
                            {currentStep > 0 ? "Back" : ""}
                        </Button>

                        <Button
                            onClick={handleNext}
                            className={cn(
                                "rounded-full px-8 shadow-md transition-all",
                                isLastStep ? "bg-hrms-success hover:bg-hrms-success/90" : "bg-primary"
                            )}
                        >
                            {isLastStep ? "Get Started" : "Next"}
                            {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
                            {isLastStep && <CheckCircle2 className="h-4 w-4 ml-2" />}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
