import { getPrograms } from "@/lib/data";
import { AdminScheduleManager } from "@/components/admin-schedule-manager";

export const dynamic = "force-dynamic";

export default async function AdminSchedulePage() {
  const programs = await getPrograms();

  // Sort programs alphabetically
  const sorted = [...programs].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Program Schedule Control</h2>
        <p className="text-sm text-white/60">
          Assign event timings, set live ongoing performances, and mark programs as completed.
        </p>
      </div>

      <AdminScheduleManager programs={sorted} />
    </div>
  );
}
