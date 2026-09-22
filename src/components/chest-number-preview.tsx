"use client";

import { useMemo } from "react";
import type { PortalStudent } from "@/lib/types";

interface ChestNumberPreviewProps {
  teamName: string;
  teamStudents: PortalStudent[];
}

export function ChestNumberPreview({ teamName, teamStudents }: ChestNumberPreviewProps) {
  const nextChestNumber = useMemo(() => {
    const prefix = teamName.slice(0, 2).toUpperCase();
    const matchingStudents = teamStudents.filter((student) => {
      const chest = student.chestNumber.toUpperCase();
      return chest.startsWith(prefix) && /^\d{3}$/.test(chest.slice(2));
    });

    if (matchingStudents.length === 0) {
      return `${prefix}001`;
    }

    const numbers = matchingStudents
      .map((student) => {
        const numStr = student.chestNumber.toUpperCase().slice(2);
        const num = parseInt(numStr, 10);
        return isNaN(num) ? 0 : num;
      })
      .filter((num) => num > 0);

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;
    return `${prefix}${String(nextNumber).padStart(3, "0")}`;
  }, [teamName, teamStudents]);

  return (
    <p className="mt-2 text-xs text-white/60">
      Next chest number: <span className="font-semibold text-emerald-300">{nextChestNumber}</span>
    </p>
  );
}

