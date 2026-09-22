"use client";

import { TrendingUp } from "lucide-react";
import { LabelList, Pie, PieChart } from "recharts";

import type { Team } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/pie-chart";

interface LiveScorePieProps {
  teams: Team[];
  liveScores: Map<string, number>;
}

// Match team brand colors used across the app
const TEAM_COLORS: Record<string, string> = {
  SAMARQAND: "#D72638",
  NAHAVAND: "#1E3A8A",
  YAMAMA: "#7C3AED",
  QURTUBA: "#FACC15",
  MUQADDAS: "#059669",
  BUKHARA: "#FB923C",
};

export function LiveScorePie({ teams, liveScores }: LiveScorePieProps) {
  const teamsWithScores = teams.map((team) => {
    const totalPoints = liveScores.get(team.id) ?? team.total_points;
    return { ...team, totalPoints };
  });

  const sorted = [...teamsWithScores].sort((a, b) => b.totalPoints - a.totalPoints);

  const chartData = sorted.map((team, index) => {
    const fallbackPalette = [
      "#D72638",
      "#1E3A8A",
      "#7C3AED",
      "#FACC15",
      "#059669",
      "#FB923C",
    ];
    const fallback = fallbackPalette[index % fallbackPalette.length];
    const fill = TEAM_COLORS[team.name] ?? fallback;
    return {
      team: team.name,
      points: team.totalPoints,
      fill,
    };
  });

  const chartConfig: ChartConfig = {
    points: {
      label: "Points",
    },
  };
  for (const entry of chartData) {
    chartConfig[entry.team] = {
      label: entry.team,
      color: entry.fill,
    };
  }

  const totalPoints = sorted.reduce((sum, t) => sum + t.totalPoints, 0);

  return (
    <div className="flex flex-col ">
      <div className="flex flex-col gap-2 p-6 pb-0">
        <div className="flex items-center gap-2">
          <CardTitle className="text-xl text-white">Funoon Fiesta Team Spread</CardTitle>
          <Badge
            tone="emerald"
            className="ml-2 flex items-center gap-1 border border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Live</span>
          </Badge>
        </div>
        <CardDescription className="text-white/60">
          Share of total points across all houses in the fest.
        </CardDescription>
      </div>
      {totalPoints === 0 ? (
        <CardContent className="flex flex-1 flex-col items-center justify-center gap-2 pb-6 pt-4">
          <p className="text-xs text-white/60">
            No scores have been recorded yet. The pie chart will appear as soon as results are added.
          </p>
        </CardContent>
      ) : (
        <CardContent className="flex flex-col items-center gap-4 pb-6 pt-2">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-text]:fill-white mx-auto h-[280px] md:h-[340px] w-full max-w-[420px]"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="team"
                  labelKey="team"
                  hideLabel
                  formatter={(value, name) => (
                    <span className="flex w-full items-center justify-between gap-4">
                      <span className="text-xs text-muted-foreground">{name}</span>
                      <span className="font-mono text-xs font-medium">
                        {formatNumber(value as number)} pts
                      </span>
                    </span>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="points"
              nameKey="team"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={3}
              cornerRadius={8}
            >
              <LabelList
                dataKey="points"
                stroke="none"
                fontSize={11}
                fontWeight={500}
                fill="currentColor"
                formatter={(value: any) => {
                  if (typeof value === 'number') {
                    return formatNumber(value);
                  }
                  return String(value ?? '');
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <p className="text-xs text-white/60">
          Total points across teams:{" "}
          <span className="font-semibold text-white">{formatNumber(totalPoints)}</span>
        </p>
      </CardContent>
      )}
    </div>
  );
}


