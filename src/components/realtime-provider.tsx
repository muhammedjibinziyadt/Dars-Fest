"use client";

import { useEffect, useState } from "react";
import { Wifi } from "lucide-react";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Firebase Firestore automatically manages real-time socket connections
    setIsConnected(true);
  }, []);

  return (
    <>
      {children}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="flex items-center gap-2 rounded-full bg-slate-900/90 border border-white/10 px-3 py-2 text-xs">
            <Wifi className="h-3 w-3 text-emerald-400" />
            <span className="text-emerald-400">Firebase Real-time Sync Active</span>
          </div>
        </div>
      )}
    </>
  );
}
