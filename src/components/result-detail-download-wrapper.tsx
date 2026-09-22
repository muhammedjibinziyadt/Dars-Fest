"use client";

import { ResultPosterDownloadButton } from "./result-poster-download-button";
import { ResultPosterShareButton } from "./result-poster-share-button";
import type { ResultRecord, Program, Student, Team } from "@/lib/types";

interface ResultDetailDownloadWrapperProps {
  result: ResultRecord;
  program: Program;
  students: Student[];
  teams: Team[];
}

export function ResultDetailDownloadWrapper({
  result,
  program,
  students,
  teams,
}: ResultDetailDownloadWrapperProps) {
  // Reconstruct Maps on client side from arrays
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return (
    <div className="flex items-center gap-3">
      <ResultPosterDownloadButton
        result={result}
        program={program}
        studentMap={studentMap}
        teamMap={teamMap}
      />
      <ResultPosterShareButton
        result={result}
        program={program}
        studentMap={studentMap}
        teamMap={teamMap}
      />
    </div>
  );
}

