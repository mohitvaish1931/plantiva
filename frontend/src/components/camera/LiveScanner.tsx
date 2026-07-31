import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RefreshCw, Zap, Maximize, ZoomIn, Info, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils';

interface LiveScannerProps {
  onCapture: (dataUrl: string) => void;
  isActive: boolean;
}

export function LiveScanner({ onCapture, isActive }: LiveScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomCapabilities, setZoomCapabilities] = useState<{ min: number; max: number; step: number } | null>(null);
  const [zoomValue, setZoomValue] = useState(1);
  const [quality, setQuality] = useState<'good' | 'low-light' | 'blur'>('good');
  
  // Initialize Camera
  const startCamera = useCallback(async () => {
    if (!isActive) return;

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Check for advanced hardware capabilities (ImageCapture API)
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {} as any;
      
      if (capabilities.torch) {
        setHasTorch(true);
      } else {
        setHasTorch(false);
      }

      if (capabilities.zoom) {
        setZoomCapabilities({
          min: capabilities.zoom.min,
          max: capabilities.zoom.max,
          step: capabilities.zoom.step
        });
        setZoomValue(capabilities.zoom.min);
      }

    } catch (err) {
      console.error('Camera access denied or unavailable', err);
    }
  }, [facingMode, isActive]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [startCamera]);

  // Handle Torch
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !hasTorch) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as any]
      });
      setTorchOn(!torchOn);
    } catch (e) {
      console.error('Torch failed', e);
    }
  }, [hasTorch, torchOn]);

  // Handle Zoom
  const handleZoom = useCallback(async (val: number) => {
    if (!streamRef.current || !zoomCapabilities) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ zoom: val }]
      });
      setZoomValue(val);
    } catch (e) {
      console.error('Zoom failed', e);
    }
  }, [zoomCapabilities]);

  // Capture Image
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      onCapture(dataUrl);
    }
  }, [onCapture]);

  // Simulated Quality Checks (Brightness check via canvas)
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = 64; // downsample for performance
        canvas.height = 64;
        ctx.drawImage(video, 0, 0, 64, 64);
        
        const imageData = ctx.getImageData(0, 0, 64, 64);
        const data = imageData.data;
        let r,g,b, avg;
        let colorSum = 0;

        for(let x = 0, len = data.length; x < len; x+=4) {
            r = data[x];
            g = data[x+1];
            b = data[x+2];
            avg = Math.floor((r+g+b)/3);
            colorSum += avg;
        }

        const brightness = Math.floor(colorSum / (video.videoWidth * video.videoHeight));
        
        if (brightness < 3) {
          setQuality('low-light');
        } else {
          setQuality('good');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden group shadow-2xl border border-white/10">
      
      {/* Video Feed */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted 
        className={cn(
          "w-full h-full object-cover transition-transform duration-500",
          facingMode === 'user' ? "scale-x-[-1]" : "" // mirror selfie cam
        )}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:33.33%_33.33%] pointer-events-none opacity-50 mix-blend-overlay" />

      {/* Bounding Box / Viewfinder */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 max-w-sm max-h-96 border-2 border-white/20 rounded-3xl z-10 pointer-events-none">
        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-accent rounded-tl-3xl shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-accent rounded-tr-3xl shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-accent rounded-bl-3xl shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-accent rounded-br-3xl shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
      </div>

      {/* Scanning Laser Line (Ambient) */}
      <motion.div
        animate={{ top: ['10%', '90%', '10%'] }}
        transition={{ duration: 4, ease: 'linear', repeat: Infinity }}
        className="absolute left-[10%] right-[10%] h-0.5 bg-accent/30 shadow-[0_0_15px_2px_rgba(16,185,129,0.3)] z-10 pointer-events-none"
      />

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
        
        {/* Quality Indicator */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
          {quality === 'low-light' ? (
            <>
              <Info className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-medium text-yellow-400">Increase Lighting</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-accent">Ready to Scan</span>
            </>
          )}
        </div>

        {/* Hardware Controls */}
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          {hasTorch && (
            <button 
              onClick={toggleTorch}
              className={cn(
                "w-10 h-10 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center transition-colors",
                torchOn ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/50" : "bg-black/40 text-white hover:bg-white/20"
              )}
            >
              <Zap className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center gap-6 z-20">
        
        {/* Zoom Slider */}
        {zoomCapabilities && (
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <ZoomIn className="w-4 h-4 text-white/70" />
            <input 
              type="range" 
              min={zoomCapabilities.min} 
              max={zoomCapabilities.max} 
              step={zoomCapabilities.step}
              value={zoomValue}
              onChange={(e) => handleZoom(parseFloat(e.target.value))}
              className="w-24 accent-white"
            />
          </div>
        )}

        {/* Capture Button */}
        <button 
          onClick={captureFrame}
          className="relative group/btn"
        >
          <div className="absolute -inset-4 bg-accent/20 rounded-full blur-xl group-hover/btn:bg-accent/30 transition-colors" />
          <div className="w-16 h-16 rounded-full bg-white border-[6px] border-black/20 flex items-center justify-center shadow-2xl relative z-10 active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-full border-2 border-black/10" />
          </div>
        </button>
      </div>

    </div>
  );
}
