"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateResultPoster, type PosterStyle } from "./result-poster-canvas";
import type { ResultRecord, Program, Student, Team } from "@/lib/types";

import { cn } from "@/lib/utils";

interface ResultPosterShareButtonProps {
  result: ResultRecord;
  program: Program;
  studentMap: Map<string, Student>;
  teamMap: Map<string, Team>;
  style?: PosterStyle;
  variant?: "default" | "secondary" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ResultPosterShareButton({
  result,
  program,
  studentMap,
  teamMap,
  style = 1,
  variant = "default",
  size = "default",
  className,
}: ResultPosterShareButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Convert data URL to blob
  const dataURLToBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleShare = async () => {
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

      // Generate the poster image
      const imgData = await generateResultPoster(posterData, style);

      // Create caption
      const caption = `Funoon Fiesta 2k25-26\n\n${program.name} result\n\nVisit our website funoonfiesta.noorululama.org`;

      // Convert data URL to blob
      const blob = dataURLToBlob(imgData);
      const file = new File([blob], `${program.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-result.png`, {
        type: "image/png",
      });

      // Check if Web Share API is available
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const webShareSupported = typeof navigator !== "undefined" && "share" in navigator;

      // Try Web Share API with files (works on some mobile browsers)
      if (webShareSupported && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `${program.name} Result - Funoon Fiesta 2k25-26`,
            text: caption,
            files: [file],
          });
          return;
        } catch (error) {
          // User cancelled or error occurred
          if ((error as Error).name === "AbortError") {
            return;
          }
          // Fall through to other methods if Web Share fails
        }
      }

      // For mobile devices - use platform-specific share methods
      if (isMobile) {
        // Try Web Share API with text and URL (works on more browsers)
        if (webShareSupported) {
          try {
            // Download image first
            const link = document.createElement("a");
            link.href = imgData;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Share text with link
            await navigator.share({
              title: `${program.name} Result - Funoon Fiesta 2k25-26`,
              text: caption,
              url: "https://funoonfiesta.noorululama.org",
            });
            return;
          } catch (error) {
            if ((error as Error).name !== "AbortError") {
              // Fall through to WhatsApp
            } else {
              return;
            }
          }
        }

        // WhatsApp share URL (mobile)
        const whatsappText = encodeURIComponent(caption);
        const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

        // Download image first
        const link = document.createElement("a");
        link.href = imgData;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Open WhatsApp
        setTimeout(() => {
          window.open(whatsappUrl, "_blank");
        }, 500);
      } else {
        // For desktop - download image and show share options
        const link = document.createElement("a");
        link.href = imgData;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Show share options modal or instructions
        if (webShareSupported) {
          try {
            await navigator.share({
              title: `${program.name} Result - Funoon Fiesta 2k25-26`,
              text: caption,
              url: "https://funoonfiesta.noorululama.org",
            });
          } catch (error) {
            // Show instructions if share fails
            const shareInfo = `Poster downloaded!\n\nTo share:\n1. Open WhatsApp/Instagram on your phone\n2. Send the downloaded image\n3. Add this caption:\n\n${caption}`;

            if (confirm(`${shareInfo}\n\nClick OK to open WhatsApp Web or Cancel to close.`)) {
              const whatsappText = encodeURIComponent(caption);
              window.open(`https://web.whatsapp.com/send?text=${whatsappText}`, "_blank");
            }
          }
        } else {
          alert(
            `Poster downloaded!\n\nTo share:\n1. Open WhatsApp/Instagram on your phone\n2. Send the downloaded image\n3. Add this caption:\n\n${caption}`
          );
        }
      }
    } catch (error) {
      console.error("Error sharing poster:", error);
      alert("Failed to share poster. Please try downloading and sharing manually.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      disabled={isGenerating}
      loading={isGenerating}
      title="Share Poster"
      className={cn("rounded-xl border-0 bg-green-600 hover:bg-green-700 text-white bg-none shadow-none", className)}
    >
      {size === "icon" ? (
        <Share2 className="w-4 h-4" />
      ) : (
        <>
          <Share2 className="w-4 h-4 mr-2" />
          Share Poster
        </>
      )}
    </Button>
  );
}

