"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getClientDb } from "@/lib/firebase-client";
import { doc, onSnapshot } from "firebase/firestore";
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

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  useEffect(() => {
    const db = getClientDb();
    // Listen to a single lightweight document instead of entire collection!
    // This reduces Firestore reads from N documents (e.g. 500 students) to EXACTLY 1 document!
    const docRef = doc(db, "system_meta", channelName);

    let isFirstSnapshot = true;

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        // Skip first snapshot on mount to avoid unnecessary initial reload
        if (isFirstSnapshot) {
          isFirstSnapshot = false;
          return;
        }

        if (!snapshot.exists()) return;
        const data = snapshot.data();

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
      },
      (error) => {
        // Silently ignore transient WebChannel connection drops which auto-retry
        if (process.env.NODE_ENV === "development") {
          if (!error.message?.includes("transport errored")) {
            console.warn(`[Firestore Realtime] ${channelName}:`, error.message);
          }
        }
      }
    );

    return () => {
      unsubscribe();
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
