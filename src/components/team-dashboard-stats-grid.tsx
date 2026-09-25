"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Calendar,
  FileText,
  Trophy,
  ArrowRight,
  LucideIcon,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { TeamWinnersModal } from "@/components/team-winners-modal";
import type { TeamPointsSummary } from "@/lib/team-points";

interface StatItem {
  label: string;
  value: string | number;
  iconName: "Users" | "Calendar" | "FileText" | "Trophy";
  color: string;
  bgColor: string;
  borderColor: string;
  link?: string;
  isPoints?: boolean;
}

interface TeamDashboardStatsGridProps {
  stats: StatItem[];
  summary: TeamPointsSummary;
  isMobile?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  Users,
  Calendar,
  FileText,
  Trophy,
};

export function TeamDashboardStatsGrid({
  stats,
  summary,
  isMobile = false,
}: TeamDashboardStatsGridProps) {
  const [modalOpen, setModalOpen] = useState(false);

  // Mobile View
  if (isMobile) {
    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const Icon = iconMap[stat.iconName] || Trophy;

            if (stat.isPoints) {
              return (
                <div
                  key={stat.label}
                  onClick={() => setModalOpen(true)}
                  className="cursor-pointer"
                >
                  <Card className="group relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-4 transition-all duration-200 hover:border-amber-400 hover:bg-amber-500/15 active:scale-[0.98] shadow-sm">
                    <div className="flex flex-col items-start gap-2.5">
                      <div className="flex items-center justify-between w-full">
                        <div className={`rounded-xl bg-gradient-to-br ${stat.color} p-2.5 shadow-md shadow-amber-500/20`}>
                          <Icon className="h-4 w-4 text-slate-950" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded-full">
                          Live
                        </span>
                      </div>
                      <div className="w-full">
                        <p className="text-xs font-medium text-white/70 mb-0.5">{stat.label}</p>
                        <p className="text-2xl font-black text-amber-300">{stat.value}</p>
                      </div>
                      <div className="flex items-center text-[11px] font-semibold text-amber-400 group-hover:text-amber-300 transition-colors">
                        View details <ArrowRight className="ml-1 h-3 w-3" />
                      </div>
                    </div>
                  </Card>
                </div>
              );
            }

            return (
              <Link key={stat.label} href={stat.link || "#"}>
                <Card className="group relative overflow-hidden border-white/10 bg-white/5 p-4 transition-all duration-200 hover:bg-white/10 hover:border-white/20 active:scale-[0.98]">
                  <div className="flex flex-col items-start gap-3">
                    <div className={`rounded-lg bg-gradient-to-br ${stat.color} p-2.5`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="w-full">
                      <p className="text-xs font-medium text-white/70 mb-1">{stat.label}</p>
                      <p className="text-xl font-bold text-white">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        <TeamWinnersModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          summary={summary}
        />
      </>
    );
  }

  // Desktop View
  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = iconMap[stat.iconName] || Trophy;

          if (stat.isPoints) {
            return (
              <div
                key={stat.label}
                onClick={() => setModalOpen(true)}
                className="cursor-pointer"
              >
                <Card className="group relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white/5 p-6 transition-all duration-300 hover:border-amber-400 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-2">
                        <p className="text-sm font-medium text-amber-200/80">{stat.label}</p>
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      </div>
                      <p className="text-3xl font-black text-amber-300">{stat.value}</p>
                    </div>
                    <div className={`rounded-2xl bg-gradient-to-br ${stat.color} p-3 shadow-lg shadow-amber-500/20`}>
                      <Icon className="h-6 w-6 text-slate-950" />
                    </div>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-amber-400 group-hover:text-amber-300 transition-colors">
                    View details <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </div>
            );
          }

          return (
            <Link key={stat.label} href={stat.link || "#"}>
              <Card className="group relative overflow-hidden border-white/10 bg-white/5 p-6 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] hover:shadow-xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/70 mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`rounded-2xl bg-gradient-to-br ${stat.color} p-3 shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center text-xs text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  View details <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <TeamWinnersModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        summary={summary}
      />
    </>
  );
}
