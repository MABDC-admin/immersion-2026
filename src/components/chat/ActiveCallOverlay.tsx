import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CallStatus } from '@/hooks/useVoiceCall';

interface ActiveCallOverlayProps {
  status: CallStatus;
  remoteName: string;
  remoteAvatar?: string;
  isMuted: boolean;
  callDuration: number;
  onEndCall: () => void;
  onToggleMute: () => void;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function ActiveCallOverlay({
  status,
  remoteName,
  remoteAvatar,
  isMuted,
  callDuration,
  onEndCall,
  onToggleMute,
}: ActiveCallOverlayProps) {
  const initials = remoteName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6 animate-fade-in">
      <div className="relative">
        <Avatar className="h-24 w-24 ring-4 ring-primary/20">
          <AvatarImage src={remoteAvatar} />
          <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
        </Avatar>
        {status === 'calling' && (
          <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
        )}
      </div>

      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold">{remoteName}</h3>
        <p className="text-sm text-muted-foreground">
          {status === 'calling' && 'Calling...'}
          {status === 'connected' && formatDuration(callDuration)}
          {status === 'ringing' && 'Ringing...'}
        </p>
      </div>

      <div className="flex items-center gap-4 mt-4">
        {status === 'connected' && (
          <Button
            variant={isMuted ? 'destructive' : 'secondary'}
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={onToggleMute}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>
        )}
        <Button
          variant="destructive"
          size="icon"
          className="h-16 w-16 rounded-full shadow-lg"
          onClick={onEndCall}
        >
          <PhoneOff className="h-7 w-7" />
        </Button>
      </div>
    </div>
  );
}
