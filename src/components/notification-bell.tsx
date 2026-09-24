"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, X, ExternalLink, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getClientDb } from "@/lib/firebase-client";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  initialNotifications?: Notification[];
  initialUnreadCount?: number;
}

export function NotificationBell({
  initialNotifications = [],
  initialUnreadCount = 0,
}: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const bellRef = useRef<HTMLButtonElement>(null);

  // Listen for new notifications via Firestore realtime
  useEffect(() => {
    const db = getClientDb();
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(20));

    let isInitial = true;
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs: Notification[] = [];
        snapshot.forEach((doc) => {
          notifs.push(doc.data() as Notification);
        });
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.read).length);

        if (!isInitial) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const newNotif = change.doc.data() as Notification;
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(newNotif.title, {
                  body: newNotif.message,
                  icon: "/icon-192x192.png",
                  badge: "/icon-96x96.png",
                });
              }
            }
          });
        }
        isInitial = false;
      },
      (err) => console.warn("Firestore notification error:", err.message)
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleNotificationClick = useCallback(async (notification: Notification) => {
    const targetUrl = notification.link || (notification.programId ? `/results/${notification.programId}` : "/scoreboard");
    router.push(targetUrl);
    setIsOpen(false);

    // Mark as read after navigation
    if (!notification.read) {
      try {
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: "POST",
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
  }, [router]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, []);

  return (
    <div className="relative">
      <motion.button
        ref={bellRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-3 rounded-full transition-all duration-300",
          "bg-white/80 backdrop-blur-md shadow-lg border border-white/20",
          "hover:bg-white hover:shadow-xl hover:border-purple-200",
          isOpen && "bg-white ring-2 ring-purple-500/20"
        )}
        aria-label="Notifications"
      >
        <Bell className={cn(
          "w-5 h-5 transition-colors",
          unreadCount > 0 ? "text-purple-600" : "text-gray-600"
        )} />

        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1 shadow-sm border-2 border-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95, transformOrigin: "top right" }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 md:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-50 max-h-[600px] overflow-hidden flex flex-col ring-1 ring-black/5"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800 text-lg">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Bell className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-900 font-medium">No notifications yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      We'll let you know when results are published!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "p-4 cursor-pointer transition-all hover:bg-gray-50 group relative",
                          !notification.read && "bg-purple-50/40 hover:bg-purple-50/60"
                        )}
                      >
                        <div className="flex gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-2 flex-shrink-0 transition-colors",
                            !notification.read ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" : "bg-gray-200"
                          )} />

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <p className={cn(
                                "text-sm font-semibold leading-tight",
                                !notification.read ? "text-gray-900" : "text-gray-700"
                              )}>
                                {notification.title}
                              </p>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                              {notification.message}
                            </p>

                            <div className="flex items-center gap-1 text-xs text-purple-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                              <span>View Results</span>
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
