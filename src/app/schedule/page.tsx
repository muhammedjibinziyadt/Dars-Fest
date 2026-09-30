import { getPrograms } from "@/lib/data";
import { ScheduleView } from "@/components/schedule-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Schedule | Maerika 2k26",
  description: "View the official program schedule, dates, timings, and live status of Maerika 2k26 festival events.",
};

export const revalidate = 30;

export default async function SchedulePage() {
  const programs = await getPrograms();

  // Sort: live first, then upcoming (by date/time), then ended
  const sortedPrograms = [...programs].sort((a, b) => {
    const statusWeight = (status?: string) => {
      if (status === "live") return 0;
      if (status === "ended") return 2;
      return 1; // upcoming
    };

    const weightDiff = statusWeight(a.scheduleStatus) - statusWeight(b.scheduleStatus);
    if (weightDiff !== 0) return weightDiff;

    // Sort by scheduledDate then scheduledTime
    const dateA = a.scheduledDate || "9999";
    const dateB = b.scheduledDate || "9999";
    if (dateA !== dateB) return dateA.localeCompare(dateB);

    const timeA = a.scheduledTime || "99:99";
    const timeB = b.scheduledTime || "99:99";
    return timeA.localeCompare(timeB);
  });

  return (
    <main className="min-h-screen bg-[#fffcf5] py-8 sm:py-12 px-4 sm:px-6 md:px-8">
      <div className="container mx-auto max-w-6xl">
        <ScheduleView programs={sortedPrograms} />
      </div>
    </main>
  );
}
