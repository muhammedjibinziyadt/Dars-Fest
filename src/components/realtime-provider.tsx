"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // In development, automatically unregister active PWA service workers and clear cache storage
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
      }
      if ("caches" in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
    }
  }, []);

  return (
    <>
      {children}
      {/* Realtime status badge in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="flex items-center gap-2 rounded-full bg-slate-900/90 border border-white/10 px-3 py-2 text-xs backdrop-blur-sm shadow-lg">
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Firebase Real-time Active</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-amber-400" />
                <span className="text-amber-400">Offline</span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
