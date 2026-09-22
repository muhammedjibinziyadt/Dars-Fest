"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Activity, Medal } from "lucide-react";
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

interface LiveScorePulseProps {
  teams: Team[];
  liveScores: Map<string, number>;
}

// Team color mappings
const TEAM_COLORS: Record<string, { primary: string; gradient: string; light: string; stroke: string }> = {
  SAMARQAND: {
    primary: "#D72638",
    gradient: "from-[#D72638] to-[#B01E2E]",
    light: "#FEE2E2",
    stroke: "#9F1221",
  },
  NAHAVAND: {
    primary: "#1E3A8A",
    gradient: "from-[#1E3A8A] to-[#172554]",
    light: "#DBEAFE",
    stroke: "#172554",
  },
  YAMAMA: {
    primary: "#7C3AED",
    gradient: "from-[#7C3AED] to-[#6D28D9]",
    light: "#EDE9FE",
    stroke: "#5B21B6",
  },
  QURTUBA: {
    primary: "#FACC15",
    gradient: "from-[#FACC15] to-[#EAB308]",
    light: "#FEF9C3",
    stroke: "#CA8A04",
  },
  MUQADDAS: {
    primary: "#059669",
    gradient: "from-[#059669] to-[#047857]",
    light: "#D1FAE5",
    stroke: "#065F46",
  },
  BUKHARA: {
    primary: "#FB923C",
    gradient: "from-[#FB923C] to-[#F97316]",
    light: "#FFEDD5",
    stroke: "#C2410C",
  },
};

function getMedalColor(index: number): string {
  switch (index) {
    case 0:
      return "#FFD700";
    case 1:
      return "#C0C0C0";
    case 2:
      return "#CD7F32";
    default:
      return "transparent";
  }
}

interface TeamCardProps {
  team: Team & { totalPoints: number; colors: { primary: string; gradient: string; light: string } };
  index: number;
  maxPoints: number;
}

function TeamCard({ team, index, maxPoints }: TeamCardProps) {
  const percentage = maxPoints > 0 ? (team.totalPoints / maxPoints) * 100 : 0;
  const isTopThree = index < 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="relative group"
    >
      <div
        className={`bg-gradient-to-br ${team.colors.gradient} rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl transform-gpu p-[3px] ${isTopThree ? 'ring-2 ring-offset-2 ring-offset-[#fffcf5]' : ''
          }`}
        style={isTopThree ? {
          boxShadow: `0 0 0 2px ${getMedalColor(index)}40, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
        } as React.CSSProperties : {}}
      >
        <div className="bg-white rounded-2xl p-3 sm:p-4 md:p-5 backdrop-blur-sm relative overflow-hidden">
          {/* Decorative gradient overlay */}
          <div
            className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 opacity-5 rounded-full blur-3xl"
            style={{ backgroundColor: team.colors.primary }}
          />

          <div className="relative z-10">
            <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center rounded-xl sm:rounded-2xl font-bold text-lg sm:text-xl md:text-2xl shadow-md sm:shadow-lg transition-transform group-hover:scale-110 shrink-0"
                  style={{
                    backgroundColor: team.colors.light,
                    border: `2px solid ${team.colors.primary}20`,
                    borderRadius: '1rem'
                  }}
                >
                  <span style={{ color: team.colors.primary }}>{team.name.charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg truncate">{team.name}</h3>
                    {isTopThree && (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        className="shrink-0"
                      >
                        <Medal className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: getMedalColor(index) }} />
                      </motion.div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      Rank #{index + 1}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-xl sm:text-2xl md:text-3xl text-gray-900 block leading-none">
                  {formatNumber(team.totalPoints)}
                </span>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">points</p>
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <div className="w-full bg-gray-100 rounded-full h-2.5 sm:h-3 md:h-3.5 overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.3, ease: "easeOut" }}
                  className="h-full rounded-full transition-all duration-500 shadow-sm relative overflow-hidden"
                  style={{
                    backgroundColor: team.colors.primary,
                    borderRadius: '9999px'
                  }}
                >
                  <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                  />
                </motion.div>
              </div>
              <div className="flex justify-between items-center text-[10px] sm:text-xs">
                <span className="text-gray-600 font-medium">Progress</span>
                <span className="font-bold text-gray-900">{percentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-xl border border-gray-100">
        <p className="font-bold text-gray-900">{data.name}</p>
        <p className="text-sm font-semibold" style={{ color: data.colors.primary }}>
          {formatNumber(data.totalPoints)} points
        </p>
      </div>
    );
  }
  return null;
};

interface DistributionChartProps {
  teams: Array<Team & { totalPoints: number; colors: { primary: string; stroke: string } }>;
}

function DesktopDistributionChart({ teams }: DistributionChartProps) {
  return (
    <div className="hidden md:flex flex-col h-full min-h-[400px] p-6 rounded-3xl bg-white border border-gray-100 shadow-xl">
      <div className="mb-6">
        <h4 className="text-lg font-bold text-gray-900">Points Distribution</h4>
        <p className="text-sm text-gray-500">Comparative analysis of team performance</p>
      </div>
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={teams} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
              dy={10}
              tickFormatter={(value) => value.slice(0, 3).toUpperCase()}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            <Bar dataKey="totalPoints" radius={[8, 8, 0, 0]} animationDuration={1500}>
              {teams.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.colors.primary} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MobileDistributionChart({ teams }: DistributionChartProps) {
  return (
    <div className="md:hidden flex flex-col h-[350px] p-4 rounded-3xl bg-white border border-gray-100 shadow-lg">
      <div className="mb-4">
        <h4 className="text-base font-bold text-gray-900">Points Distribution</h4>
        <p className="text-xs text-gray-500">Team performance overview</p>
      </div>
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={teams}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              width={80}
              tick={{ fill: '#4B5563', fontSize: 11, fontWeight: 600 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            <Bar dataKey="totalPoints" radius={[0, 10, 10, 0]} barSize={20} animationDuration={1500}>
              {teams.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.colors.primary} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function LiveScorePulse({ teams, liveScores }: LiveScorePulseProps) {
  const teamsWithScores = teams.map((team) => {
    const totalPoints = liveScores.get(team.id) ?? team.total_points;
    const colors = TEAM_COLORS[team.name] || {
      primary: "#6B7280",
      gradient: "from-gray-500 to-gray-600",
      light: "#F9FAFB",
      stroke: "#4B5563",
    };
    return { ...team, totalPoints, colors };
  });

  const sortedTeams = [...teamsWithScores].sort((a, b) => b.totalPoints - a.totalPoints);
  const maxPoints = Math.max(...sortedTeams.map((t) => t.totalPoints), 1);

  return (
    <section className="space-y-6 sm:space-y-8 md:space-y-10">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-2 sm:space-y-3 md:space-y-4 px-2"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4 mb-1 sm:mb-2">
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl md:rounded-2xl shadow-md sm:shadow-lg">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-cyan-400 rounded-lg sm:rounded-xl md:rounded-2xl opacity-20 blur-xl"
            />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-serif text-[#8B4513] mb-0.5 sm:mb-1">
              Live Score Pulse
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base">Real-time team rankings & performance</p>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {/* Team Cards */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            {sortedTeams.map((team, index) => (
              <TeamCard key={team.id} team={team} index={index} maxPoints={maxPoints} />
            ))}
          </div>
        </div>

        {/* Distribution Charts */}
        <div className="order-1 lg:order-2">
          <DesktopDistributionChart teams={sortedTeams} />
          <MobileDistributionChart teams={sortedTeams} />
        </div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 pt-4 sm:pt-6 px-4"
      >
        <Link
          href="/scoreboard"
          className="group relative bg-gradient-to-r from-[#8B4513] to-[#6B3410] hover:from-[#6B3410] hover:to-[#8B4513] transition-all py-3 sm:py-4 px-6 sm:px-10 rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg font-semibold text-white shadow-xl hover:shadow-2xl transform-gpu transition-all duration-300 hover:scale-105 overflow-hidden w-full sm:w-auto text-center"
        >
          <span className="relative z-10">View Full Scoreboard</span>
          <motion.div
            className="absolute inset-0 bg-white/20"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.5 }}
          />
        </Link>
        <Link
          href="/results"
          className="group relative bg-gradient-to-r from-[#0d7377] to-[#0a5a5d] hover:from-[#0a5a5d] hover:to-[#0d7377] transition-all py-3 sm:py-4 px-6 sm:px-10 rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg font-semibold text-white shadow-xl hover:shadow-2xl transform-gpu transition-all duration-300 hover:scale-105 overflow-hidden w-full sm:w-auto text-center"
        >
          <span className="relative z-10">View Results</span>
          <motion.div
            className="absolute inset-0 bg-white/20"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.5 }}
          />
        </Link>
      </motion.div>
    </section>
  );
}
