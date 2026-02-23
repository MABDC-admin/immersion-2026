import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface IncomingCallModalProps {
  open: boolean;
  callerName: string;
  callerAvatar?: string;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallModal({
  open,
  callerName,
  callerAvatar,
  onAccept,
  onReject,
}: IncomingCallModalProps) {
  const initials = callerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm text-center" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogTitle className="sr-only">Incoming Call</DialogTitle>
        <DialogDescription className="sr-only">
          {callerName} is calling you
        </DialogDescription>
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-4 ring-primary/20">
              <AvatarImage src={callerAvatar} />
              <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
          </div>

          <div>
            <h3 className="text-lg font-bold">{callerName}</h3>
            <p className="text-sm text-muted-foreground">Incoming voice call...</p>
          </div>

          <div className="flex items-center gap-6">
            <Button
              variant="destructive"
              size="icon"
              className="h-14 w-14 rounded-full"
              onClick={onReject}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white"
              onClick={onAccept}
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
