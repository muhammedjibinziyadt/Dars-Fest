"use client";

import { useRouter } from "next/navigation";
import { useResultUpdates, useScoreboardUpdates } from "@/hooks/use-realtime";
import { useEffect } from "react";

interface RealtimePageWrapperProps {
  children: React.ReactNode;
  refreshOnResults?: boolean;
  refreshOnScoreboard?: boolean;
}

export function RealtimePageWrapper({
  children,
  refreshOnResults = false,
  refreshOnScoreboard = false,
}: RealtimePageWrapperProps) {
  const router = useRouter();

  const handleUpdate = () => {
    router.refresh();
  };

  if (refreshOnResults) {
    useResultUpdates(handleUpdate);
  }

  if (refreshOnScoreboard) {
    useScoreboardUpdates(handleUpdate);
  }

  return <>{children}</>;
}










