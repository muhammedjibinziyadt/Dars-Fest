"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { VerticalNavSidebar } from "./vertical-nav-sidebar";
import { NotificationProvider } from "./notification-provider";

interface PublicPageWrapperProps {
  children: ReactNode;
}

export function PublicPageWrapper({ children }: PublicPageWrapperProps) {
  const pathname = usePathname();

  // Check if we're on a public page (not admin, jury, or team portal)
  const isPublicPage = !pathname.startsWith("/admin") &&
    !pathname.startsWith("/jury") &&
    !pathname.startsWith("/team");

  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-[#fffcf5] relative flex flex-col justify-between">
        <VerticalNavSidebar />
        <div className="fixed top-4 right-4 z-50">
          <NotificationProvider />
        </div>
        <div className="flex-1">
          {children}
        </div>
        <footer className="border-t border-amber-900/10 bg-[#faf6ed] text-center py-6 px-4 pb-24 lg:pb-6 text-xs text-gray-600 space-y-1 mt-12">
          <p className="font-semibold text-gray-800">Maerika 2K26 · കലായുഗ ഭാവുകം</p>
          <p>Jawharathul Uloom Suffa Dars Arts Fest</p>
          <p>
            Official Website:{" "}
            <a
              href="https://maerika-2k26.jawharathululoomsuffadars.online"
              className="text-[#8B4513] hover:underline font-medium"
            >
              maerika-2k26.jawharathululoomsuffadars.online
            </a>
          </p>
        </footer>
      </div>
    );
  }

  // For admin/jury/team pages, use the original dark background
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#3b0764,_#020617_55%)]">

      {children}
    </div>
  );
}

