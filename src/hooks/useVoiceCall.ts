import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface CallState {
  status: CallStatus;
  remoteEmployeeId: string | null;
  conversationId: string | null;
  isMuted: boolean;
  callDuration: number;
}

interface SignalPayload {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-request' | 'call-accepted' | 'call-rejected' | 'call-ended';
  from: string;
  to: string;
  conversationId: string;
  data?: any;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useVoiceCall(currentEmployeeId: string) {
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    remoteEmployeeId: null,
    conversationId: null,
    isMuted: false,
    callDuration: 0,
  });

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteAudio = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

  // Create audio element for remote stream
  useEffect(() => {
    if (!remoteAudio.current) {
      remoteAudio.current = new Audio();
      remoteAudio.current.autoplay = true;
    }
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (remoteAudio.current) {
      remoteAudio.current.srcObject = null;
    }
    pendingCandidates.current = [];
  }, []);

  const sendSignal = useCallback((payload: SignalPayload) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'voice-call',
      payload,
    });
  }, []);

  const endCall = useCallback(() => {
    if (callState.remoteEmployeeId && callState.conversationId) {
      sendSignal({
        type: 'call-ended',
        from: currentEmployeeId,
        to: callState.remoteEmployeeId,
        conversationId: callState.conversationId,
      });
    }
    cleanup();
    setCallState({
      status: 'idle',
      remoteEmployeeId: null,
      conversationId: null,
      isMuted: false,
      callDuration: 0,
    });
  }, [callState.remoteEmployeeId, callState.conversationId, currentEmployeeId, sendSignal, cleanup]);

  const setupPeerConnection = useCallback(async () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnection.current = pc;

    // Get microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    } catch (err) {
      toast.error('Microphone access denied');
      cleanup();
      setCallState((s) => ({ ...s, status: 'idle', remoteEmployeeId: null, conversationId: null }));
      return null;
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      if (remoteAudio.current && event.streams[0]) {
        remoteAudio.current.srcObject = event.streams[0];
      }
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && callState.remoteEmployeeId && callState.conversationId) {
        sendSignal({
          type: 'ice-candidate',
          from: currentEmployeeId,
          to: callState.remoteEmployeeId,
          conversationId: callState.conversationId,
          data: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    return pc;
  }, [currentEmployeeId, callState.remoteEmployeeId, callState.conversationId, sendSignal, cleanup, endCall]);

  const startDurationTimer = useCallback(() => {
    setCallState((s) => ({ ...s, callDuration: 0 }));
    durationInterval.current = setInterval(() => {
      setCallState((s) => ({ ...s, callDuration: s.callDuration + 1 }));
    }, 1000);
  }, []);

  // Subscribe to signaling channel
  const joinSignalingChannel = useCallback(
    (conversationId: string) => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase.channel(`call:${conversationId}`);
      channelRef.current = channel;

      channel
        .on('broadcast', { event: 'voice-call' }, async ({ payload }: { payload: SignalPayload }) => {
          if (payload.to !== currentEmployeeId) return;

          switch (payload.type) {
            case 'call-request':
              setCallState((s) => ({
                ...s,
                status: 'ringing',
                remoteEmployeeId: payload.from,
                conversationId: payload.conversationId,
              }));
              break;

            case 'call-accepted': {
              const pc = peerConnection.current;
              if (!pc) break;
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              sendSignal({
                type: 'offer',
                from: currentEmployeeId,
                to: payload.from,
                conversationId,
                data: offer,
              });
              break;
            }

            case 'offer': {
              let pc = peerConnection.current;
              if (!pc) {
                pc = await setupPeerConnection() as RTCPeerConnection;
                if (!pc) break;
              }
              await pc.setRemoteDescription(new RTCSessionDescription(payload.data));
              // Apply pending ICE candidates
              for (const candidate of pendingCandidates.current) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              }
              pendingCandidates.current = [];
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              sendSignal({
                type: 'answer',
                from: currentEmployeeId,
                to: payload.from,
                conversationId,
                data: answer,
              });
              setCallState((s) => ({ ...s, status: 'connected' }));
              startDurationTimer();
              break;
            }

            case 'answer': {
              const pc = peerConnection.current;
              if (!pc) break;
              await pc.setRemoteDescription(new RTCSessionDescription(payload.data));
              // Apply pending ICE candidates
              for (const candidate of pendingCandidates.current) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              }
              pendingCandidates.current = [];
              setCallState((s) => ({ ...s, status: 'connected' }));
              startDurationTimer();
              break;
            }

            case 'ice-candidate': {
              const pc = peerConnection.current;
              if (pc && pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(payload.data));
              } else {
                pendingCandidates.current.push(payload.data);
              }
              break;
            }

            case 'call-rejected':
              toast.info('Call was declined');
              cleanup();
              setCallState({
                status: 'idle',
                remoteEmployeeId: null,
                conversationId: null,
                isMuted: false,
                callDuration: 0,
              });
              break;

            case 'call-ended':
              cleanup();
              setCallState({
                status: 'idle',
                remoteEmployeeId: null,
                conversationId: null,
                isMuted: false,
                callDuration: 0,
              });
              break;
          }
        })
        .subscribe();
    },
    [currentEmployeeId, sendSignal, setupPeerConnection, cleanup, startDurationTimer]
  );

  const initiateCall = useCallback(
    async (remoteEmployeeId: string, conversationId: string) => {
      setCallState({
        status: 'calling',
        remoteEmployeeId,
        conversationId,
        isMuted: false,
        callDuration: 0,
      });

      joinSignalingChannel(conversationId);

      // Setup peer connection early
      const pc = await setupPeerConnection();
      if (!pc) return;

      // Send call request
      sendSignal({
        type: 'call-request',
        from: currentEmployeeId,
        to: remoteEmployeeId,
        conversationId,
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        setCallState((s) => {
          if (s.status === 'calling') {
            toast.info('No answer');
            cleanup();
            return {
              status: 'idle',
              remoteEmployeeId: null,
              conversationId: null,
              isMuted: false,
              callDuration: 0,
            };
          }
          return s;
        });
      }, 30000);
    },
    [currentEmployeeId, joinSignalingChannel, setupPeerConnection, sendSignal, cleanup]
  );

  const acceptCall = useCallback(async () => {
    if (!callState.conversationId || !callState.remoteEmployeeId) return;

    joinSignalingChannel(callState.conversationId);
    await setupPeerConnection();

    sendSignal({
      type: 'call-accepted',
      from: currentEmployeeId,
      to: callState.remoteEmployeeId,
      conversationId: callState.conversationId,
    });

    setCallState((s) => ({ ...s, status: 'connected' }));
  }, [callState.conversationId, callState.remoteEmployeeId, currentEmployeeId, joinSignalingChannel, setupPeerConnection, sendSignal]);

  const rejectCall = useCallback(() => {
    if (callState.remoteEmployeeId && callState.conversationId) {
      sendSignal({
        type: 'call-rejected',
        from: currentEmployeeId,
        to: callState.remoteEmployeeId,
        conversationId: callState.conversationId,
      });
    }
    cleanup();
    setCallState({
      status: 'idle',
      remoteEmployeeId: null,
      conversationId: null,
      isMuted: false,
      callDuration: 0,
    });
  }, [callState.remoteEmployeeId, callState.conversationId, currentEmployeeId, sendSignal, cleanup]);

  const toggleMute = useCallback(() => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState((s) => ({ ...s, isMuted: !audioTrack.enabled }));
      }
    }
  }, []);

  // Listen for incoming calls globally
  useEffect(() => {
    if (!currentEmployeeId) return;

    const channel = supabase.channel(`call-listen:${currentEmployeeId}`);
    channel
      .on('broadcast', { event: 'voice-call' }, ({ payload }: { payload: SignalPayload }) => {
        if (payload.to !== currentEmployeeId) return;
        if (payload.type === 'call-request' && callState.status === 'idle') {
          setCallState({
            status: 'ringing',
            remoteEmployeeId: payload.from,
            conversationId: payload.conversationId,
            isMuted: false,
            callDuration: 0,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentEmployeeId, callState.status]);

  return {
    callState,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
  };
}
