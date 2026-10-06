import { NextResponse } from "next/server";
import { getNotifications, getUnreadNotificationCount } from "@/lib/notification-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

let cachedNotifs: any = null;
let lastFetchTime = 0;
const CACHE_WINDOW_MS = 60_000; // 1 minute cache in-memory

export async function GET() {
  const now = Date.now();
  if (cachedNotifs && now - lastFetchTime < CACHE_WINDOW_MS) {
    return NextResponse.json(cachedNotifs, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      getNotifications(20),
      getUnreadNotificationCount(),
    ]);
    cachedNotifs = { notifications: notifications || [], unreadCount: unreadCount || 0 };
    lastFetchTime = now;
    return NextResponse.json(cachedNotifs, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error: any) {
    console.warn("GET /api/notifications error (serving cached fallback):", error?.message || error);
    if (cachedNotifs) {
      return NextResponse.json(cachedNotifs);
    }
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}
