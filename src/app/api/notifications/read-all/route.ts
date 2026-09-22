import { NextResponse } from "next/server";
import { markAllNotificationsAsRead } from "@/lib/notification-service";

export async function POST() {
  try {
    await markAllNotificationsAsRead();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}

