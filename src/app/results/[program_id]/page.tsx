import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy } from "lucide-react";
import {
  getApprovedResults,
  getJuries,
  getPrograms,
  getStudents,
  getTeams,
} from "@/lib/data";
import { formatNumber } from "@/lib/utils";
import { ResultPosterPreview } from "@/components/result-poster-preview";

interface ProgramDetailPageProps {
  params: Promise<{ program_id: string }>;
}

async function getProgramDetail(programId: string) {
  const [results, programs, students, teams, juries] = await Promise.all([
    getApprovedResults(),
    getPrograms(),
    getStudents(),
    getTeams(),
    getJuries(),
  ]);

  const program = programs.find((p) => p.id === programId);
  const programResults = results.filter((r) => r.program_id === programId);

  const programMap = new Map(programs.map((p) => [p.id, p]));
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const juryMap = new Map(juries.map((j) => [j.id, j]));

  return {
    program,
    result: programResults[0], // Get the first (and should be only) result for this program
    programMap,
    studentMap,
    teamMap,
    juryMap,
  };
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const { program_id } = await params;
  const data = await getProgramDetail(program_id);

  if (!data.program) {
    return (
      <main className="mx-auto max-w-5xl space-y-12 px-5 py-16 md:px-8">
        <Card className="bg-white border-gray-200 shadow-md">
          <CardTitle className="text-gray-900">Program not found</CardTitle>
          <CardDescription className="mt-2 text-gray-600">
            The program you&apos;re looking for doesn&apos;t exist or has no results yet.
          </CardDescription>
          <Link href="/results" className="mt-6 inline-block">
            <Button variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300">Back to Results</Button>
          </Link>
        </Card>
      </main>
    );
  }

  if (!data.result) {
    return (
      <main className="mx-auto max-w-5xl space-y-12 px-5 py-16 md:px-8">
        <Link href="/results" className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Results
        </Link>
        <Card className="bg-white border-gray-200 shadow-md">
          <CardTitle className="text-gray-900">{data.program.name}</CardTitle>
          <CardDescription className="mt-2 text-gray-600">
            No approved results available for this program yet.
          </CardDescription>
        </Card>
      </main>
    );
  }

  const juryName = data.juryMap.get(data.result.jury_id)?.name ?? data.result.submitted_by;

  return (
    <main className="mx-auto max-w-5xl space-y-12 px-5 py-16 md:px-8">
      <Link
        href="/results"
        className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Results
      </Link>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-yellow-600" />
              <h1 className="text-4xl font-bold text-gray-900">{data.program.name}</h1>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200">Section: {data.program.section}</Badge>
              <Badge className="bg-pink-100 text-pink-800 border-pink-200">Category: {data.program.category}</Badge>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Jury: {juryName}</Badge>
            </div>
          </div>
        </div>

        <Card className="border-gray-200 bg-white shadow-md">
          <CardTitle className="mb-6 text-gray-900">Podium Winners</CardTitle>
          <div className="grid gap-6 md:grid-cols-3">
            {data.result.entries
              .sort((a, b) => a.position - b.position)
              .map((entry) => {
                const student = entry.student_id
                  ? data.studentMap.get(entry.student_id)
                  : undefined;
                const team = entry.team_id
                  ? data.teamMap.get(entry.team_id)
                  : student
                    ? data.teamMap.get(student.team_id)
                    : undefined;

                const positionColors = {
                  1: "bg-yellow-50 border-yellow-300",
                  2: "bg-gray-50 border-gray-300",
                  3: "bg-orange-50 border-orange-300",
                };

                return (
                  <div
                    key={`${data.result.id}-${entry.position}`}
                    className={`rounded-2xl border-2 ${positionColors[entry.position as keyof typeof positionColors]} p-6 shadow-md`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-lg font-bold text-gray-900">
                        {entry.position === 1
                          ? "🥇 1st Place"
                          : entry.position === 2
                            ? "🥈 2nd Place"
                            : "🥉 3rd Place"}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {student?.name ?? team?.name ?? "—"}
                    </p>
                    {student && (
                      <p className="text-sm text-gray-600 mb-3">
                        Chest #{student.chest_no}
                      </p>
                    )}
                    {team && (
                      <p className="text-xs uppercase text-gray-600 mb-3">
                        {team.name}
                      </p>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">Score</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatNumber(entry.score)}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
          {(data.result.penalties?.length ?? 0) > 0 && (
            <div className="mt-8 rounded-2xl border border-red-300 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800">Minus points applied</p>
              <div className="mt-3 space-y-3">
                {data.result.penalties?.map((penalty, index) => {
                  const student = penalty.student_id
                    ? data.studentMap.get(penalty.student_id)
                    : undefined;
                  const team =
                    penalty.team_id && (!student || student.team_id === penalty.team_id)
                      ? data.teamMap.get(penalty.team_id)
                      : student
                        ? data.teamMap.get(student.team_id)
                        : data.teamMap.get(penalty.team_id ?? "");
                  return (
                    <div key={`${penalty.team_id ?? penalty.student_id ?? index}`} className="text-sm text-gray-800">
                      <p className="font-semibold">
                        {student?.name ?? team?.name ?? "Unknown"} · -{penalty.points} pts
                      </p>
                      {student && (
                        <p className="text-xs text-gray-600">
                          Chest #{student.chest_no} · Team {team?.name ?? "Unknown"}
                        </p>
                      )}
                      {!student && team && (
                        <p className="text-xs text-gray-600">Team ID: {team.id}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <p className="mt-6 text-xs text-gray-500">
            Approved on {new Date(data.result.submitted_at).toLocaleString()}
          </p>
        </Card>

        <Card className="border-gray-200 bg-white shadow-md">
          <ResultPosterPreview
            result={data.result}
            program={data.program}
            students={Array.from(data.studentMap.values())}
            teams={Array.from(data.teamMap.values())}
          />
        </Card>
      </div>
    </main>
  );
}

