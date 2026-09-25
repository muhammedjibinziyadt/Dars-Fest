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
      <div className="min-h-screen bg-[#fffcf5] relative">
        <VerticalNavSidebar />
        <div className="fixed top-4 right-4 z-50">
          <NotificationProvider />
        </div>
        {children}
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

