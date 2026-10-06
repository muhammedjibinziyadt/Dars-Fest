"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { CHANNELS, EVENTS } from "@/lib/pusher-client";

type EventCallback = (data: any) => void;

// Global refresh lock to prevent multiple simultaneous refreshes across all hooks
let isRefreshing = false;
let refreshTimeout: NodeJS.Timeout | null = null;
let pendingRefresh = false;

export function useRealtimeSubscription(
  channelName: string,
  _eventName: string,
  callback: EventCallback,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);
  const router = useRouter();
  const lastTimestampRef = useRef<number>(Date.now());

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  useEffect(() => {
    let isMounted = true;

    async function checkPulse() {
      if (!isMounted || typeof document === "undefined" || document.hidden) return;

      try {
        const res = await fetch(`/api/realtime/pulse?channel=${encodeURIComponent(channelName)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.timestamp && data.timestamp > lastTimestampRef.current) {
          lastTimestampRef.current = data.timestamp;
          callbackRef.current(data);

          if (!isRefreshing) {
            isRefreshing = true;
            pendingRefresh = false;

            if (refreshTimeout) {
              clearTimeout(refreshTimeout);
            }

            refreshTimeout = setTimeout(() => {
              router.refresh();
              setTimeout(() => {
                isRefreshing = false;
                if (pendingRefresh) {
                  pendingRefresh = false;
                  router.refresh();
                }
              }, 500);
            }, 400);
          } else {
            pendingRefresh = true;
          }
        }
      } catch {
        // Silently ignore transient network fetch failures
      }
    }

    // Check pulse every 4 seconds
    const interval = setInterval(checkPulse, 4000);

    // Also check immediately when window gains focus
    const onFocus = () => {
      checkPulse();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        refreshTimeout = null;
      }
    };
  }, [channelName, router]);

  const refresh = useCallback(() => {
    if (!isRefreshing) {
      isRefreshing = true;
      router.refresh();
      setTimeout(() => {
        isRefreshing = false;
      }, 200);
    }
  }, [router]);

  return { refresh };
}

// Specific hooks for different use cases
export function useResultUpdates(onUpdate: () => void) {
  useRealtimeSubscription(CHANNELS.RESULTS, EVENTS.RESULT_APPROVED, onUpdate);
}

export function useAssignmentUpdates(onUpdate: () => void) {
  useRealtimeSubscription(CHANNELS.ASSIGNMENTS, EVENTS.ASSIGNMENT_CREATED, onUpdate);
}

export function useRegistrationUpdates(onUpdate: () => void) {
  useRealtimeSubscription(CHANNELS.REGISTRATIONS, EVENTS.REGISTRATION_CREATED, onUpdate);
}

export function useStudentUpdates(onUpdate: () => void) {
  useRealtimeSubscription(CHANNELS.STUDENTS, EVENTS.STUDENT_CREATED, onUpdate);
}

export function useScoreboardUpdates(onUpdate: () => void) {
  useRealtimeSubscription(CHANNELS.SCOREBOARD, EVENTS.SCOREBOARD_UPDATED, onUpdate);
}
