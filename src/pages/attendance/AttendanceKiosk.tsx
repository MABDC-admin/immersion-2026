import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Camera, QrCode, LogIn, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type ClockResult = {
  action: 'clock_in' | 'clock_out';
  employeeName: string;
  timestamp: string;
} | null;

export default function AttendanceKiosk() {
  const { supervisorId } = useParams<{ supervisorId: string }>();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ClockResult>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  const { data: supervisor } = useQuery({
    queryKey: ['kiosk-supervisor', supervisorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('first_name, last_name, job_title, avatar_url')
        .eq('id', supervisorId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!supervisorId,
  });

  const startScanning = async () => {
    try {
      setError(null);
      setResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      // Use BarcodeDetector API if available
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        intervalRef.current = window.setInterval(async () => {
          if (!videoRef.current || processing) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              handleQRData(barcodes[0].rawValue);
            }
          } catch {}
        }, 500);
      } else {
        setError('QR scanning requires a browser with BarcodeDetector API (Chrome, Edge). Please use a supported browser.');
      }
    } catch (err: any) {
      setError('Camera access denied. Please allow camera access to scan QR codes.');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => stopScanning();
  }, []);

  const handleQRData = async (rawValue: string) => {
    if (processing) return;
    setProcessing(true);
    stopScanning();

    try {
      const parsed = JSON.parse(rawValue);
      if (!parsed.employeeId || !parsed.supervisorId) {
        setError('Invalid QR code format.');
        setProcessing(false);
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/kiosk-clock`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            employeeId: parsed.employeeId,
            supervisorId: parsed.supervisorId,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to process clock action.');
      } else {
        setResult({
          action: data.action,
          employeeName: data.employeeName,
          timestamp: data.timestamp,
        });
      }
    } catch {
      setError('Failed to read QR code data.');
    }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-primary/10 mb-2">
            <QrCode className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Attendance Kiosk</h1>
          {supervisor && (
            <p className="text-sm text-muted-foreground">
              Supervisor: {supervisor.first_name} {supervisor.last_name}
            </p>
          )}
        </div>

        {/* Scanner */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {!scanning && !result && !processing && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Camera className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  Scan an intern's QR code to clock in or out
                </p>
                <Button onClick={startScanning} className="gap-2">
                  <Camera className="h-4 w-4" /> Start Scanning
                </Button>
              </div>
            )}

            {scanning && (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden bg-black aspect-square">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 border-2 border-primary/50 rounded-lg pointer-events-none" />
                  <div className="absolute inset-[20%] border-2 border-primary rounded-lg pointer-events-none animate-pulse" />
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <Button variant="outline" className="w-full" onClick={stopScanning}>
                  Cancel
                </Button>
              </div>
            )}

            {processing && (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Processing...</p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className={cn(
                  "p-4 rounded-full",
                  result.action === 'clock_in' ? 'bg-hrms-success/10' : 'bg-primary/10'
                )}>
                  {result.action === 'clock_in' ? (
                    <LogIn className="h-10 w-10 text-hrms-success" />
                  ) : (
                    <LogOut className="h-10 w-10 text-primary" />
                  )}
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-foreground">
                    {result.action === 'clock_in' ? 'Clocked In' : 'Clocked Out'}
                  </h3>
                  <p className="text-sm font-medium">{result.employeeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(result.timestamp), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <Button onClick={() => { setResult(null); startScanning(); }} className="gap-2">
                  <Camera className="h-4 w-4" /> Scan Next
                </Button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="p-4 rounded-full bg-destructive/10">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <p className="text-sm text-destructive text-center">{error}</p>
                <Button onClick={() => { setError(null); startScanning(); }} variant="outline" className="gap-2">
                  <Camera className="h-4 w-4" /> Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground text-center">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>
    </div>
  );
}
