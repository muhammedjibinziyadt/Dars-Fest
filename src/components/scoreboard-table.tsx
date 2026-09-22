"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, ChevronRight, TrendingUp } from "lucide-react";
import type { Team, Program, ResultRecord, ResultEntry, Student } from "@/lib/types";

interface ScoreboardTableProps {
  teams: Team[];
  programs: Program[];
  results: ResultRecord[];
  students: Student[];
  liveScores: Map<string, number>;
}

interface TeamCardProps {
  team: Team;
  totalPoints: number;
  medals: { gold: number; silver: number; bronze: number; total: number };
  isActive: boolean;
  onClick: () => void;
}

function TeamCard({ team, totalPoints, medals, isActive, onClick }: TeamCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${
        isActive ? "ring-2 ring-[#8B4513]" : ""
      } bg-white rounded-xl shadow-md border border-gray-200 p-4 hover:shadow-lg cursor-pointer transition-all`}
    >
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-900">{team.name}</h3>
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">{totalPoints}</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {medals.gold > 0 && (
              <div className="flex items-center" title="Gold Medals">
                <span className="text-xl">🥇</span>
                <span className="text-xs font-bold ml-1">{medals.gold}</span>
              </div>
            )}
            {medals.silver > 0 && (
              <div className="flex items-center" title="Silver Medals">
                <span className="text-xl">🥈</span>
                <span className="text-xs font-bold ml-1">{medals.silver}</span>
              </div>
            )}
            {medals.bronze > 0 && (
              <div className="flex items-center" title="Bronze Medals">
                <span className="text-xl">🥉</span>
                <span className="text-xs font-bold ml-1">{medals.bronze}</span>
              </div>
            )}
          </div>
          <ChevronRight
            className={`w-5 h-5 transition-transform duration-300 ${
              isActive ? "rotate-90" : ""
            } text-gray-400`}
          />
        </div>
      </div>
    </motion.div>
  );
}

interface MobileScoreCardProps {
  program: Program;
  teamNames: string[];
  teams: Team[];
  results: ResultRecord[];
  students: Student[];
  isExpanded: boolean;
  onToggle: () => void;
}

function MobileScoreCard({
  program,
  teamNames,
  teams,
  results,
  students,
  isExpanded,
  onToggle,
}: MobileScoreCardProps) {
  const teamNameMap = new Map(teams.map((t) => [t.name, t]));
  const studentMap = new Map(students.map((s) => [s.id, s]));
  return (
    <motion.div
      initial={false}
      animate={{ backgroundColor: isExpanded ? "rgba(139, 69, 19, 0.1)" : "transparent" }}
      className="bg-white rounded-lg shadow-md border border-gray-200 mb-4 overflow-hidden"
    >
      <div
        className={`flex justify-between items-center p-4 cursor-pointer ${
          isExpanded
            ? "bg-[#8B4513]/10"
            : "hover:bg-gray-50"
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <Trophy
            className={`w-5 h-5 transition-colors duration-300 ${
              isExpanded ? "text-[#8B4513]" : "text-gray-400"
            }`}
          />
          <div className="flex flex-col">
            <span
              className={`font-semibold transition-colors duration-300 ${
                isExpanded ? "text-[#8B4513]" : "text-gray-900"
              }`}
            >
              {program.name.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden bg-gray-50"
      >
        {teamNames.map((teamName, index) => {
          const team = teamNameMap.get(teamName);
          if (!team) return null;

          const teamResults = results.filter((r) => {
            return r.entries.some(
              (e) =>
                e.team_id === team.id ||
                (e.student_id && studentMap.get(e.student_id)?.team_id === team.id),
            );
          });

          if (teamResults.length === 0) return null;

          return (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              key={teamName}
              className="px-4 py-3 border-t border-gray-200 flex justify-between items-center hover:bg-gray-100"
            >
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{teamName}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-end gap-1">
                  {teamResults.flatMap((result, resultIdx) => {
                    // Get ALL entries for this team in this result (not just the first one)
                    return result.entries
                      .filter(
                        (e) =>
                          e.team_id === team.id ||
                          (e.student_id && studentMap.get(e.student_id)?.team_id === team.id),
                      )
                      .map((entry, entryIdx) => (
                        <div key={`${resultIdx}-${entryIdx}`} className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {entry.score}
                          </span>
                          <span className="text-lg transform hover:scale-110 transition-transform">
                            {entry.position === 1 && "🥇"}
                            {entry.position === 2 && "🥈"}
                            {entry.position === 3 && "🥉"}
                          </span>
                        </div>
                      ));
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

export function ScoreboardTable({
  teams,
  programs,
  results,
  students,
  liveScores,
}: ScoreboardTableProps) {
  const [activeTeam, setActiveTeam] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  const teamNames = teams.map((t) => t.name);
  const studentMap = new Map(students.map((s) => [s.id, s]));

  // Organize programs by section
  const singlePrograms = programs.filter((p) => p.section === "single");
  const groupPrograms = programs.filter((p) => p.section === "group");
  const generalPrograms = programs.filter((p) => p.section === "general");

  const getTotalPointsForTeam = (teamId: string): number => {
    return liveScores.get(teamId) ?? 0;
  };

  const getTotalPenaltyPoints = (teamId: string): number => {
    let total = 0;
    results.forEach((result) => {
      if (result.penalties) {
        result.penalties.forEach((penalty) => {
          if (penalty.team_id === teamId) {
            total += penalty.points;
          } else if (penalty.student_id) {
            const student = studentMap.get(penalty.student_id);
            if (student?.team_id === teamId) {
              total += penalty.points;
            }
          }
        });
      }
    });
    return total;
  };

  const getMedalCount = (teamId: string) => {
    let gold = 0;
    let silver = 0;
    let bronze = 0;

    results.forEach((result) => {
      result.entries.forEach((entry) => {
        if (entry.team_id === teamId) {
          if (entry.position === 1) gold++;
          if (entry.position === 2) silver++;
          if (entry.position === 3) bronze++;
        } else if (entry.student_id) {
          const student = studentMap.get(entry.student_id);
          if (student?.team_id === teamId) {
            if (entry.position === 1) gold++;
            if (entry.position === 2) silver++;
            if (entry.position === 3) bronze++;
          }
        }
      });
    });

    return { gold, silver, bronze, total: gold + silver + bronze };
  };

  const renderMobileView = () => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: {
            opacity: 1,
            y: 0,
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.2,
            },
          },
        }}
        className="grid grid-cols-2 gap-4"
      >
        {teams.map((team) => (
          <motion.div
            key={team.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 },
            }}
          >
            <TeamCard
              team={team}
              totalPoints={getTotalPointsForTeam(team.id)}
              medals={getMedalCount(team.id)}
              isActive={activeTeam === team.id}
              onClick={() => setActiveTeam(activeTeam === team.id ? null : team.id)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Minus Points Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-red-50 rounded-xl shadow-md border border-red-200 p-4"
      >
        <h3 className="text-lg font-bold text-red-900 mb-4">MINUS POINTS</h3>
        <div className="grid grid-cols-2 gap-4">
          {teams.map((team) => {
            const penaltyTotal = getTotalPenaltyPoints(team.id);
            return (
              <div key={team.id} className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{team.name}</span>
                <span className="font-semibold text-red-600">
                  {penaltyTotal > 0 ? `-${penaltyTotal}` : "-"}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="space-y-4"
      >
        {[
          { title: "Single Programs", programs: singlePrograms },
          { title: "Group Programs", programs: groupPrograms },
          { title: "General Programs", programs: generalPrograms },
        ].map(({ title, programs: sectionPrograms }) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <motion.button
              onClick={() => setExpandedSection(expandedSection === title ? null : title)}
              className="w-full flex justify-between items-center p-4 bg-[#8B4513] rounded-lg text-white font-semibold hover:bg-[#6B3410] transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              <span>{title}</span>
              <ChevronRight
                className={`w-5 h-5 transition-transform duration-300 ${
                  expandedSection === title ? "rotate-90" : ""
                }`}
              />
            </motion.button>
            <motion.div
              initial={false}
              animate={{
                height: expandedSection === title ? "auto" : 0,
                opacity: expandedSection === title ? 1 : 0,
              }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {sectionPrograms.map((program) => {
                const programResults = results.filter((r) => r.program_id === program.id);
                if (programResults.length === 0) return null;
                return (
                  <MobileScoreCard
                    key={program.id}
                    program={program}
                    teamNames={teamNames}
                    teams={teams}
                    results={programResults}
                    students={students}
                    isExpanded={expandedProgram === program.id}
                    onToggle={() => setExpandedProgram(expandedProgram === program.id ? null : program.id)}
                  />
                );
              })}
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );

  const renderDesktopView = () => {
    const allPrograms = [...singlePrograms, ...groupPrograms, ...generalPrograms];

    return (
      <div className="overflow-x-auto rounded-lg bg-white border border-gray-200 shadow-lg">
        <table className="table-auto w-full border-collapse text-sm sm:text-base">
          <thead>
            <tr className="bg-[#8B4513] text-white">
              <th className="px-4 py-4 text-left">PROGRAM NAME</th>
              {teamNames.map((team) => (
                <th key={team} className="px-4 py-4 text-center">
                  {team}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {allPrograms.map((program) => {
              const programResults = results.filter((r) => r.program_id === program.id);
              return (
                <tr
                  key={program.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-4 py-3 font-semibold text-[#8B4513]">
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4" />
                      <span>{program.name.toUpperCase()}</span>
                    </div>
                  </td>
                  {teams.map((team) => {
                    // Get ALL entries for this team in this program (not just the first one)
                    const teamEntries: Array<{ entry: ResultEntry; result: ResultRecord }> = [];
                    programResults.forEach((result) => {
                      result.entries.forEach((entry) => {
                        const isTeamEntry = entry.team_id === team.id ||
                          (entry.student_id && studentMap.get(entry.student_id)?.team_id === team.id);
                        if (isTeamEntry) {
                          teamEntries.push({ entry, result });
                        }
                      });
                    });

                    return (
                      <td key={team.id} className="px-4 py-3 text-center">
                        {teamEntries.length > 0 ? (
                          <div className="flex flex-col items-center gap-1.5">
                            {teamEntries.map(({ entry }, idx) => (
                              <div key={idx} className="flex items-center justify-center space-x-2">
                                <span className="font-medium text-gray-900">
                                  {entry.score}
                                </span>
                                <span className="text-lg transform hover:scale-110 transition-transform">
                                  {entry.position === 1 && "🥇"}
                                  {entry.position === 2 && "🥈"}
                                  {entry.position === 3 && "🥉"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr className="bg-gray-100 font-bold">
              <td className="px-4 py-4 text-gray-900">TOTAL</td>
              {teams.map((team) => (
                <td key={team.id} className="px-4 py-4 text-center text-lg text-[#8B4513]">
                  {getTotalPointsForTeam(team.id)}
                </td>
              ))}
            </tr>
            <tr className="bg-red-50 font-semibold">
              <td className="px-4 py-3 text-gray-900">MINUS POINTS</td>
              {teams.map((team) => {
                const penaltyTotal = getTotalPenaltyPoints(team.id);
                return (
                  <td key={team.id} className="px-4 py-3 text-center text-red-600">
                    {penaltyTotal > 0 ? `-${penaltyTotal}` : "-"}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const NoDataMessage = () => (
    <div className="text-center py-8">
      <div className="flex flex-col items-center space-y-4">
        <Trophy className="w-12 h-12 text-gray-400" />
        <h3 className="text-xl font-semibold text-gray-700">No Data Available</h3>
        <p className="text-gray-600">No results have been approved yet.</p>
      </div>
    </div>
  );

  const hasData = results.length > 0;

  return (
    <div className="container mx-auto px-4 py-12 md:px-12">
      <div className="flex flex-col items-center mb-8 space-y-6">
        <h1 className="text-3xl md:text-4xl font-bold text-[#8B4513] text-center">
          <span className="flex items-center justify-center space-x-3">
            <Medal className="w-8 h-8 text-[#8B4513]" />
            <span>SCOREBOARD</span>
            <Medal className="w-8 h-8 text-[#8B4513]" />
          </span>
        </h1>
      </div>

      {!hasData ? (
        <NoDataMessage />
      ) : (
        <>
          <div className="md:hidden h-auto">{renderMobileView()}</div>
          <div className="hidden md:block">{renderDesktopView()}</div>
        </>
      )}
    </div>
  );
}


