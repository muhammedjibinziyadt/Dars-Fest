"use client";

import { useState, useEffect } from "react";
import { generateResultPoster, type PosterStyle } from "./result-poster-canvas";
import { ResultPosterDownloadButton } from "./result-poster-download-button";
import { ResultPosterShareButton } from "./result-poster-share-button";
import type { ResultRecord, Program, Student, Team } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface ResultPosterPreviewProps {
  result: ResultRecord;
  program: Program;
  studentMap: Map<string, Student>;
  teamMap: Map<string, Team>;
}

interface ResultPosterPreviewWrapperProps {
  result: ResultRecord;
  program: Program;
  students: Student[];
  teams: Team[];
}

function ResultPosterPreviewInner({
  result,
  program,
  studentMap,
  teamMap,
}: ResultPosterPreviewProps) {
  const [posterUrls, setPosterUrls] = useState<Map<PosterStyle, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generatePreviews = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Prepare prize data from result entries
        const prizes = result.entries
          .sort((a, b) => a.position - b.position)
          .map((entry) => {
            const student = entry.student_id
              ? studentMap.get(entry.student_id)
              : undefined;
            const team = entry.team_id
              ? teamMap.get(entry.team_id)
              : student
                ? teamMap.get(student.team_id)
                : undefined;

            return {
              position: entry.position,
              studentName: student?.name,
              teamName: team?.name,
              chestNumber: student?.chest_no,
            };
          });

        // Generate poster data
        const posterData = {
          programName: program.name,
          section: program.section,
          category: program.category !== "none" ? program.category : undefined,
          prizes: prizes.filter((p) => p.position <= 3) as Array<{
            position: 1 | 2 | 3;
            studentName?: string;
            teamName?: string;
            chestNumber?: string;
          }>,
        };

        // Generate all 3 poster styles
        const styles: PosterStyle[] = [1, 2, 3];
        const urlMap = new Map<PosterStyle, string>();

        for (const style of styles) {
          try {
            const imgData = await generateResultPoster(posterData, style);
            urlMap.set(style, imgData);
          } catch (err) {
            console.error(`Error generating poster style ${style}:`, err);
          }
        }

        setPosterUrls(urlMap);
      } catch (err) {
        console.error("Error generating poster previews:", err);
        setError("Failed to generate poster previews");
      } finally {
        setIsLoading(false);
      }
    };

    generatePreviews();
  }, [result, program, studentMap, teamMap]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          <p className="text-sm text-gray-500">Generating poster preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (posterUrls.size === 0) {
    return null;
  }

  const styles: PosterStyle[] = [1, 2, 3];
  const styleNames = {
    1: "Style 1",
    2: "Style 2",
    3: "Style 3",
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Poster Previews</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {styles.map((style) => {
          const posterUrl = posterUrls.get(style);
          if (!posterUrl) return null;

          return (
            <div key={style} className="flex flex-col items-center space-y-4">
              <div className="relative border-2 border-gray-200 shadow-2xl w-full inline-block">
                <img
                  src={posterUrl}
                  alt={`${program.name} Result Poster - ${styleNames[style]}`}
                  className="w-full h-auto block"
                  style={{ display: "block" }}
                />
              </div>
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1">
                  <ResultPosterDownloadButton
                    result={result}
                    program={program}
                    studentMap={studentMap}
                    teamMap={teamMap}
                    style={style}
                    variant="default"
                    size="default"
                    className="w-full"
                  />
                </div>
                <ResultPosterShareButton
                  result={result}
                  program={program}
                  studentMap={studentMap}
                  teamMap={teamMap}
                  style={style}
                  variant="default"
                  size="icon"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ResultPosterPreview({
  result,
  program,
  students,
  teams,
}: ResultPosterPreviewWrapperProps) {
  // Reconstruct Maps on client side from arrays
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return (
    <ResultPosterPreviewInner
      result={result}
      program={program}
      studentMap={studentMap}
      teamMap={teamMap}
    />
  );
}

