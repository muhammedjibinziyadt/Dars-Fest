"use client";

import React, { useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { Camera, CameraOff, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamically import Scanner from @yudiel/react-qr-scanner to avoid SSR issues
const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-950 text-white/60">
        <Camera className="h-10 w-10 animate-pulse text-cyan-400 mb-2" />
        <p className="text-xs">Initializing camera system...</p>
      </div>
    ),
  }
);

interface ScannedCodeItem {
  rawValue?: string;
}

interface EmbeddedQRScannerProps {
  onScan: (scannedText: string) => void;
  isScanning: boolean;
  onToggleScanning?: () => void;
  isProcessing?: boolean;
  hideHeader?: boolean;
}

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function EmbeddedQRScanner({
  onScan,
  isScanning,
  onToggleScanning,
  isProcessing = false,
  hideHeader = false,
}: EmbeddedQRScannerProps) {
  const mounted = useIsMounted();
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedTime, setLastScannedTime] = useState<number>(0);

  if (!mounted) return null;

  const handleScan = (detectedCodes: ScannedCodeItem[]) => {
    if (!detectedCodes || detectedCodes.length === 0 || isProcessing) return;

    // Debounce scans by 1.5 seconds to avoid repeated immediate triggers for the same frame
    const now = Date.now();
    if (now - lastScannedTime < 1500) return;
    setLastScannedTime(now);

    const rawValue = detectedCodes[0]?.rawValue;
    if (rawValue) {
      if (navigator.vibrate) {
        navigator.vibrate(150);
      }
      onScan(rawValue);
    }
  };

  const handleError = (err: unknown) => {
    console.error("Camera scanner error:", err);
    const errObj = err as { name?: string };
    if (errObj?.name === "NotAllowedError" || errObj?.name === "PermissionDeniedError") {
      setCameraError("Camera permission denied. Please allow camera access in browser settings.");
    } else if (errObj?.name === "NotFoundError" || errObj?.name === "DevicesNotFoundError") {
      setCameraError("No camera hardware found on this device.");
    } else {
      setCameraError("Camera error. Please ensure permissions are granted.");
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl ${hideHeader ? "bg-slate-950 border border-white/10" : "border border-white/10 bg-slate-900/80 backdrop-blur-md shadow-2xl"}`}>
      {/* Scanner Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className={`h-3 w-3 rounded-full ${isScanning ? "bg-emerald-400 animate-ping" : "bg-white/30"}`} />
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Camera className="h-4 w-4 text-cyan-400" />
              Built-in QR Code Scanner
            </h3>
          </div>
          {onToggleScanning && (
            <Button
              type="button"
              size="sm"
              onClick={onToggleScanning}
              variant={isScanning ? "destructive" : "default"}
              className={`rounded-xl text-xs font-semibold gap-1.5 transition-all ${
                isScanning
                  ? "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                  : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold shadow-md shadow-cyan-500/20"
              }`}
            >
              {isScanning ? (
                <>
                  <CameraOff className="h-3.5 w-3.5" />
                  Stop Camera
                </>
              ) : (
                <>
                  <Camera className="h-3.5 w-3.5" />
                  Start Scanner
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Camera View Area */}
      <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {isScanning ? (
          cameraError ? (
            <div className="p-6 text-center text-red-300 space-y-3 max-w-sm">
              <AlertCircle className="h-10 w-10 mx-auto text-red-400" />
              <p className="text-xs leading-relaxed">{cameraError}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setCameraError(null);
                  onToggleScanning?.();
                }}
                className="text-xs border-red-500/30 text-white hover:bg-red-500/10"
              >
                Dismiss
              </Button>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <Scanner
                onScan={handleScan}
                onError={handleError}
                components={{
                  onOff: false,
                  torch: true,
                  zoom: true,
                  finder: false, // We render our own sleek custom finder
                }}
                styles={{
                  container: { width: "100%", height: "100%" },
                  video: { width: "100%", height: "100%", objectFit: "cover" },
                }}
              />

              {/* Custom High-Tech Laser Reticle / Finder */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-56 w-56 sm:h-64 sm:w-64 rounded-3xl border-2 border-dashed border-cyan-400/60 bg-cyan-400/5 backdrop-blur-[1px] shadow-[0_0_30px_rgba(6,182,212,0.25)] flex items-center justify-center">
                  {/* Glowing Laser Scan Line */}
                  <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce" />

                  {/* Corner Target Accents */}
                  <div className="absolute top-2 left-2 h-4 w-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
                  <div className="absolute top-2 right-2 h-4 w-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
                  <div className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
                  <div className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />

                  <span className="text-[11px] font-bold tracking-wider uppercase text-cyan-300/80 bg-slate-950/80 px-2.5 py-1 rounded-full border border-cyan-500/30">
                    Align QR Badge
                  </span>
                </div>
              </div>

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                  <div className="h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-2" />
                  <p className="text-xs font-bold text-cyan-300">Verifying Candidate...</p>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="p-8 text-center space-y-4 max-w-sm">
            <div className="h-16 w-16 mx-auto rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Camera className="h-8 w-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Scanner Inactive</h4>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">
                Click &quot;Start Scanner&quot; to activate your device camera and scan student ID badges.
              </p>
            </div>
            <Button
              type="button"
              onClick={onToggleScanning}
              className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold rounded-xl px-5 py-2 text-xs shadow-lg shadow-cyan-500/20 gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Launch Camera
            </Button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-5 py-3 bg-white/[0.02] border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
        <span>Scans participant QR codes & URLs</span>
        <span className="text-cyan-400 font-mono">Maerika Auto-Verify</span>
      </div>
    </div>
  );
}
