"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateResultPoster, type PosterStyle } from "./result-poster-canvas";
import type { ResultRecord, Program, Student, Team } from "@/lib/types";

import { cn } from "@/lib/utils";

interface ResultPosterDownloadButtonProps {
  result: ResultRecord;
  program: Program;
  studentMap: Map<string, Student>;
  teamMap: Map<string, Team>;
  style?: PosterStyle;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ResultPosterDownloadButton({
  result,
  program,
  studentMap,
  teamMap,
  style = 1,
  variant = "default",
  size = "default",
  className,
}: ResultPosterDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);

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

      // Generate the poster image (now async)
      const imgData = await generateResultPoster(posterData, style);

      // Create download link
      const link = document.createElement("a");
      const sanitizedProgramName = program.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      link.download = `${sanitizedProgramName}-result-style-${style}.png`;
      link.href = imgData;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating poster:", error);
      alert("Failed to generate poster. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isGenerating}
      loading={isGenerating}
      title="Download Poster"
      className={cn("rounded-xl border-0 hover:bg-purple-700 text-white", className)}
    >
      {size === "icon" ? (
        <Download className="w-4 h-4" />
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Download Poster
        </>
      )}
    </Button>
  );
}

