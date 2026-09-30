"use server";

import { updateProgramById } from "@/lib/data";
import { invalidateCache } from "@/lib/models";
import { revalidatePath } from "next/cache";

export async function updateProgramScheduleAction(
  programId: string,
  scheduledDate: string,
  scheduledTime: string,
  scheduleStatus: "upcoming" | "live" | "ended"
) {
  try {
    await updateProgramById(programId, {
      scheduledDate,
      scheduledTime,
      scheduleStatus,
    });
    invalidateCache("programs");
    revalidatePath("/admin/schedule");
    revalidatePath("/schedule");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating schedule:", error);
    return { success: false, error: error?.message || "Failed to update schedule" };
  }
}

export async function markProgramEndedAction(programId: string) {
  try {
    await updateProgramById(programId, {
      scheduleStatus: "ended",
    });
    invalidateCache("programs");
    revalidatePath("/admin/schedule");
    revalidatePath("/schedule");
    return { success: true };
  } catch (error: any) {
    console.error("Error marking program ended:", error);
    return { success: false, error: error?.message || "Failed to mark as ended" };
  }
}

export async function markProgramLiveAction(programId: string) {
  try {
    await updateProgramById(programId, {
      scheduleStatus: "live",
    });
    invalidateCache("programs");
    revalidatePath("/admin/schedule");
    revalidatePath("/schedule");
    return { success: true };
  } catch (error: any) {
    console.error("Error marking program live:", error);
    return { success: false, error: error?.message || "Failed to mark as live" };
  }
}

export async function clearProgramScheduleAction(programId: string) {
  try {
    await updateProgramById(programId, {
      scheduledDate: "",
      scheduledTime: "",
      scheduleStatus: "upcoming",
    });
    invalidateCache("programs");
    revalidatePath("/admin/schedule");
    revalidatePath("/schedule");
    return { success: true };
  } catch (error: any) {
    console.error("Error clearing schedule:", error);
    return { success: false, error: error?.message || "Failed to clear schedule" };
  }
}
