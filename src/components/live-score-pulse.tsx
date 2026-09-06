"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Activity, Medal, TrendingUp, Minus, ArrowUpRight, BarChart3, LineChart, ShieldAlert } from "lucide-react";
import type { Team } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";

interface LiveScorePulseProps {
  teams: Team[];
  liveScores: Map<string, number>;
}

function getTeamColors(color?: string) {
  const primary = color && /^#([0-9A-F]{3}){1,2}$/i.test(color) ? color : "#8B4513";
  return {
    primary,
    gradient: "from-amber-600 to-amber-500",
    light: "#FEF3C7",
    stroke: primary,
    glow: "shadow-amber-500/20",
  };
}

function getMedalColor(rank: number): string {
  switch (rank) {
    case 1: return "#FFD700";
    case 2: return "#C0C0C0";
    case 3: return "#CD7F32";
    default: return "transparent";
  }
}

interface TeamCardProps {
  team: Team & { totalPoints: number; colors: ReturnType<typeof getTeamColors> };
  index: number;
  rank: number;
  maxPoints: number;
}

function TeamCard({ team, index, rank, maxPoints }: TeamCardProps) {
  const percentage = maxPoints > 0 ? (team.totalPoints / maxPoints) * 100 : 0;
  const isTopThree = rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative group"
    >
      <div
        className={`relative overflow-hidden bg-white border border-gray-100 rounded-3xl p-5 transition-all duration-300 ${team.colors.glow} hover:shadow-2xl shadow-xl z-0`}
      >
        <div
          className="absolute top-0 left-0 w-1.5 h-full"
          style={{ backgroundColor: team.colors.primary }}
        />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl text-white font-bold shadow-lg"
              style={{ backgroundColor: team.colors.primary }}
            >
              <span className="text-lg leading-none">#{rank}</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-lg tracking-tight">{team.name}</h3>
                {isTopThree && (
                  <Medal className="w-5 h-5 drop-shadow-md animate-pulse" style={{ color: getMedalColor(rank) }} />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                {rank === 1 ? (
                  <div className="flex items-center text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    <TrendingUp className="w-3 h-3 mr-1" /> Leading
                  </div>
                ) : rank <= 3 ? (
                  <div className="flex items-center text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    <TrendingUp className="w-3 h-3 mr-1" /> Chasing
                  </div>
                ) : (
                  <div className="flex items-center text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                    <Minus className="w-3 h-3 mr-1" /> Stable
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="block text-3xl font-black text-gray-900 tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatNumber(team.totalPoints)}
            </span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Points</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
            <span>Performance</span>
            <span style={{ color: team.colors.primary }}>{percentage.toFixed(0)}%</span>
          </div>
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden p-[2px]">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${percentage}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "circOut" }}
              className="h-full rounded-full relative overflow-hidden"
              style={{ backgroundColor: team.colors.primary }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 ring-1 ring-black/5">
        <p className="font-bold text-gray-900 text-lg mb-1">{data.name}</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.colors.primary }} />
          <p className="font-mono font-bold text-gray-600">
            {formatNumber(data.totalPoints)} <span className="text-xs font-sans font-normal text-gray-400">PTS</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

function AnalyticsSection({ teams }: { teams: any[] }) {
  const [viewMode, setViewMode] = useState<'total' | 'daily' | 'category'>('total');

  return (
    <div className="h-full bg-white border border-gray-100 rounded-3xl p-6 shadow-xl flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#8B4513]" /> Analytics
          </h4>
          <p className="text-sm text-gray-500">Live performance breakdown</p>
        </div>

        <div className="flex p-1 bg-gray-100 rounded-3xl">
          <button
            onClick={() => setViewMode('total')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${viewMode === 'total' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Total
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${viewMode === 'daily' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Daily
          </button>
          <button
            onClick={() => setViewMode('category')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${viewMode === 'category' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Cat.
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px] relative">
        {viewMode === 'total' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teams} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 700 }}
                dy={10}
                tickFormatter={(value: string) => value.slice(0, 3).toUpperCase()}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
              <Bar dataKey="totalPoints" radius={[6, 6, 6, 6]} barSize={32} animationDuration={1000}>
                {teams.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.colors.primary} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <LineChart className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-sm font-medium">Detailed breakdown coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function LiveScorePulse({ teams, liveScores }: LiveScorePulseProps) {
  if (!teams || teams.length === 0) {
    return (
      <section className="space-y-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 animate-pulse">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
              </span>
              <span className="text-red-600 font-bold tracking-widest text-xs uppercase">Live Updates</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#8B4513] to-amber-600">SCORE</span> PULSE
            </h2>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center text-gray-500 shadow-xl max-w-lg mx-auto">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">No Teams Created Yet</h3>
          <p className="text-sm text-gray-500">Create teams in the Admin Panel to see real-time score tracking and analytics.</p>
        </div>
      </section>
    );
  }

  const teamsWithScores = teams.map((team) => {
    const totalPoints = liveScores.get(team.id) ?? team.total_points ?? 0;
    const colors = getTeamColors(team.color);
    return { ...team, totalPoints, colors };
  });

  const sortedTeams = [...teamsWithScores].sort((a, b) => b.totalPoints - a.totalPoints);

  let currentRank = 1;
  const rankedTeams = sortedTeams.map((team, index) => {
    if (index > 0 && team.totalPoints < sortedTeams[index - 1].totalPoints) {
      currentRank++;
    }
    return { ...team, rank: currentRank };
  });

  const maxPoints = Math.max(...rankedTeams.map((t) => t.totalPoints), 1);

  return (
    <section className="space-y-8 relative z-10">
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-40 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2"
          >
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 animate-pulse">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
            </span>
            <span className="text-red-600 font-bold tracking-widest text-xs uppercase">Live Updates</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#8B4513] to-amber-600">SCORE</span> PULSE
          </h2>
          <p className="text-gray-500 max-w-md text-lg">
            Real-time tracking of the championship race. Watch the battle unfold.
          </p>
        </div>

        <div className="hidden md:block pb-2">
          <div className="flex -space-x-2">
            {rankedTeams.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center font-bold text-xs"
                style={{ backgroundColor: t.colors.light, color: t.colors.primary }}
              >
                {t.name[0]}
              </div>
            ))}
            {rankedTeams.length > 3 && (
              <div className="w-10 h-10 rounded-full border-2 border-white shadow-lg bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-400">
                +{rankedTeams.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rankedTeams.map((team, index) => (
              <TeamCard key={team.id} team={team} index={index} rank={team.rank} maxPoints={maxPoints} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1"
          >
            <AnalyticsSection teams={sortedTeams} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 gap-3"
          >
            <Link href="/scoreboard" className="w-full">
              <Button className="w-full h-14 text-lg font-bold bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-900/20 hover:shadow-zinc-900/30 transition-all rounded-2xl group cursor-pointer">
                Full Scoreboard <ArrowUpRight className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
