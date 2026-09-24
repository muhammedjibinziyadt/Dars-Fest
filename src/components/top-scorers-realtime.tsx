"use client";

import { useScoreboardUpdates } from "@/hooks/use-realtime";
import { TopScorersShowcase } from "@/components/top-scorers-showcase";
import type { TopScorerDataResult } from "@/lib/top-scorer-service";

interface TopScorersRealtimeProps {
  data: TopScorerDataResult;
  showTitle?: boolean;
}

export function TopScorersRealtime({
  data,
  showTitle = true,
}: TopScorersRealtimeProps) {
  // useScoreboardUpdates handles debounced router.refresh() automatically
  useScoreboardUpdates(() => {});

  return <TopScorersShowcase data={data} showTitle={showTitle} />;
}
