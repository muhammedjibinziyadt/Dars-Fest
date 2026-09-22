"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getClientDb } from "@/lib/firebase-client";
import { collection, onSnapshot, query } from "firebase/firestore";
import { CHANNELS, EVENTS } from "@/lib/pusher-client";

type EventCallback = (data: any) => void;

// Global refresh lock to prevent multiple simultaneous refreshes across all hooks
let isRefreshing = false;
let refreshTimeout: NodeJS.Timeout | null = null;
let pendingRefresh = false;

// Map logical channels to Firestore collections
const CHANNEL_COLLECTION_MAP: Record<string, string> = {
  results: "results_approved",
  scoreboard: "live_scores",
  assignments: "assigned_programs",
  registrations: "program_registrations",
  students: "students",
  notifications: "notifications",
};

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
    const collectionName = CHANNEL_COLLECTION_MAP[channelName] || channelName;
    const colRef = collection(db, collectionName);

    let isFirstSnapshot = true;

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        // Skip first snapshot on mount to avoid unnecessary initial reload
        if (isFirstSnapshot) {
          isFirstSnapshot = false;
          return;
        }

        const changes = snapshot.docChanges();
        if (changes.length === 0) return;

        callbackRef.current(changes.map((c) => ({ type: c.type, doc: c.doc.data() })));

        if (!isRefreshing) {
          isRefreshing = true;
          pendingRefresh = false;

          if (refreshTimeout) {
            clearTimeout(refreshTimeout);
          }

          router.refresh();

          refreshTimeout = setTimeout(() => {
            isRefreshing = false;
            if (pendingRefresh) {
              pendingRefresh = false;
              router.refresh();
              setTimeout(() => {
                isRefreshing = false;
              }, 200);
            }
          }, 300);
        } else {
          pendingRefresh = true;
        }
      },
      (error) => {
        console.warn(`[Firestore Realtime] Error on ${collectionName}:`, error.message);
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
