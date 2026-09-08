"use client";

import { useEffect, useState } from "react";
import { Wifi } from "lucide-react";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Firebase Firestore automatically manages real-time socket connections
    setIsConnected(true);
  }, []);

  return <>{children}</>;
}
