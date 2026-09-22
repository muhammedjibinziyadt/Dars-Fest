"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import { X, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface QRScannerProps {
    onScan: (chestNumber: string) => void;
    onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
    const [mounted, setMounted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleScan = (detectedCodes: any[]) => {
        if (detectedCodes && detectedCodes.length > 0) {
            const decodedText = detectedCodes[0].rawValue;
            let chestNumber = decodedText;

            // Extract chest number if it's a URL
            if (decodedText.includes("/participant/")) {
                chestNumber = decodedText.split("/participant/")[1]?.split("?")[0] || decodedText;
            }

            // Play success sound/vibration
            if (navigator.vibrate) navigator.vibrate(200);

            onScan(chestNumber);
        }
    };

    const handleError = (err: any) => {
        console.error("Scanner error:", err);
        // Only show user-facing errors for critical issues
        if (err?.name === "NotAllowedError" || err?.name === "NotFoundError") {
            setError("Camera access denied or no camera found. Please check your permissions.");
        }
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm md:p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-black md:bg-white md:dark:bg-gray-900 w-full h-full md:h-auto md:max-w-md md:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col md:max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-gray-800 md:border-gray-100 md:dark:border-gray-800 shrink-0 bg-black/50 md:bg-transparent absolute top-0 left-0 right-0 z-10 md:static backdrop-blur-md md:backdrop-blur-none text-white md:text-gray-900 md:dark:text-white">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Camera className="w-5 h-5 text-purple-500 md:text-purple-600" />
                        Scan Participant QR
                    </h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full hover:bg-white/10 md:hover:bg-gray-100 md:dark:hover:bg-gray-800 text-white md:text-gray-900 md:dark:text-white"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Scanner Area */}
                <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                    {!error ? (
                        <div className="w-full h-full">
                            <Scanner
                                onScan={handleScan}
                                onError={handleError}
                                components={{
                                    onOff: false,
                                    torch: true,
                                    zoom: true,
                                    finder: true,
                                }}
                                styles={{
                                    container: { width: "100%", height: "100%" },
                                    video: { width: "100%", height: "100%", objectFit: "cover" }
                                }}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-white/80 space-y-4">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                            <p>{error}</p>
                            <Button onClick={onClose} variant="secondary" className="mt-4">
                                Close Scanner
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 text-center shrink-0 bg-black/50 md:bg-white md:dark:bg-gray-900 absolute bottom-0 left-0 right-0 md:static backdrop-blur-md md:backdrop-blur-none z-10">
                    <p className="text-sm text-white/80 md:text-gray-500 md:dark:text-gray-400">
                        Point your camera at the participant's QR code badge.
                    </p>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
