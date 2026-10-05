import { NextResponse } from "next/server";
import { getNotifications, getUnreadNotificationCount } from "@/lib/notification-service";

export async function GET() {
  try {
    const [notifications, unreadCount] = await Promise.all([
      getNotifications(50),
      getUnreadNotificationCount(),
    ]);
    return NextResponse.json(
      { notifications, unreadCount },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

