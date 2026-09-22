"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Award, AlertTriangle, Star } from "lucide-react";
import type { ParticipantProfile } from "@/lib/participant-service";
import { QRCodeDisplay } from "./qr-code-display";
import { motion } from "framer-motion";

interface ParticipantProfileProps {
  profile: ParticipantProfile;
}

const COLORS = {
  first: "#FFD700",
  second: "#C0C0C0",
  third: "#CD7F32",
  gradeA: "#10B981",
  gradeB: "#3B82F6",
  gradeC: "#F59E0B",
};

const STATUS_COLORS = {
  completed: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  pending_result: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  registered: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  no_result: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
};

export function ParticipantProfileDisplay({ profile }: ParticipantProfileProps) {
  const { student, team, registrations, totalPoints, stats } = profile;

  // Chart data for points breakdown
  const pointsChartData = useMemo(() => {
    const bySection = registrations.reduce(
      (acc, reg) => {
        const section = reg.program.section;
        if (!acc[section]) {
          acc[section] = { name: section, points: 0, count: 0 };
        }
        acc[section].points += reg.result?.score || 0;
        acc[section].count += 1;
        return acc;
      },
      {} as Record<string, { name: string; points: number; count: number }>,
    );

    return Object.values(bySection).map((item) => ({
      ...item,
      name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
    }));
  }, [registrations]);

  // Chart data for wins
  const winsData = useMemo(
    () => [
      { name: "1st Place", value: stats.wins.first, color: COLORS.first },
      { name: "2nd Place", value: stats.wins.second, color: COLORS.second },
      { name: "3rd Place", value: stats.wins.third, color: COLORS.third },
    ],
    [stats.wins],
  );

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col justify-between items-center md:flex-row"
      >
        <div className="p-6 flex-1 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <Avatar className="h-28 w-28 border-4 border-white dark:border-gray-800 shadow-lg">
              <AvatarImage src={student.avatar} alt={student.name} className="object-cover" />
              <AvatarFallback className="text-3xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                {student.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm">
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: team.color }} title={team.name} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {student.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">
            {student.chest_no} • {team.name}
          </p>

          <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Points</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{totalPoints}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Items</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalPrograms}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Wins</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.wins.first + stats.wins.second + stats.wins.third}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-center pt-4">
        <QRCodeDisplay chestNumber={student.chest_no} participantName={student.name} />
      </div>
      </motion.div>
      

      {/* Stats Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Points Chart */}
        <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm rounded-3xl">
          <CardTitle className="mb-4 text-base text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart className="w-4 h-4 text-gray-400" />
            Points Analysis
          </CardTitle>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pointsChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: '#F3F4F6', opacity: 0.4 }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="points" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Wins Chart */}
        <Card className="p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm rounded-3xl">
          <CardTitle className="mb-4 text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gray-400" />
            Victory Stats
          </CardTitle>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {winsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.wins.first + stats.wins.second + stats.wins.third}
                </span>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">Wins</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Programs List */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white px-1">Program History</h2>

        {registrations.length === 0 ? (
          <Card className="p-8 text-center bg-white dark:bg-gray-900 border-dashed border-2 border-gray-200 dark:border-gray-800 rounded-3xl">
            <p className="text-sm text-gray-500 dark:text-gray-400">No registrations found.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {registrations.map((reg, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={reg.id}
              >
                <Card className="p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 pr-2">
                      {reg.program.name}
                    </h3>
                    <Badge className={`shrink-0 text-[10px] px-2 h-5 ${STATUS_COLORS[reg.status]} border`}>
                      {reg.status === 'completed' ? 'Done' : reg.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-md">
                      {reg.program.section}
                    </span>
                    {reg.program.category !== "none" && (
                      <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-md">
                        Cat {reg.program.category}
                      </span>
                    )}
                  </div>

                  {reg.result ? (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        {reg.result.position && (
                          <div className="flex items-center gap-1">
                            <Trophy className={`w-3.5 h-3.5 ${reg.result.position === 1 ? 'text-yellow-500' :
                                reg.result.position === 2 ? 'text-gray-400' : 'text-amber-600'
                              }`} />
                            <span className="font-bold text-sm text-gray-900 dark:text-white">
                              {reg.result.position === 1 ? '1st' : reg.result.position === 2 ? '2nd' : '3rd'}
                            </span>
                          </div>
                        )}
                        {reg.result.grade && reg.result.grade !== "none" && (
                          <div className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-green-500" />
                            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">{reg.result.grade}</span>
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-sm text-purple-600 dark:text-purple-400">{reg.result.score} pts</span>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 italic text-right">
                      Result pending
                    </div>
                  )}

                  {reg.penalty && (
                    <div className="mt-2 text-[10px] text-red-500 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 p-1.5 rounded-lg">
                      <AlertTriangle className="w-3 h-3" />
                      <span>-{reg.penalty.points}: {reg.penalty.reason}</span>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
