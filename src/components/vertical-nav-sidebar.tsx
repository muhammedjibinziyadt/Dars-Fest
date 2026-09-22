"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Trophy,
  BarChart3,
  Search,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/results", label: "Results", icon: Trophy },
  { href: "/scoreboard", label: "Scoreboard", icon: BarChart3 },
  { href: "/participant", label: "Find Participant", icon: Search },
  { href: "/chatbot", label: "AI Assistant", icon: Bot },
];

export function VerticalNavSidebar() {
  const pathname = usePathname();

  const renderLink = (item: typeof navItems[number], orientation: "vertical" | "horizontal") => {
    const Icon = item.icon;
    const isActive =
      pathname === item.href ||
      (item.href !== "/" && pathname?.startsWith(item.href));

    return (
      <Link
        key={`${orientation}-${item.label}`}
        href={item.href}
        className={cn(
          "relative flex items-center justify-center transition-all duration-300 text-center",
          orientation === "vertical"
            ? "w-12 h-12 rounded-2xl group hover:rounded-2xl"
            : "flex-1 flex-col py-2 rounded-2xl",
          isActive
            ? "bg-[#8B4513] text-white shadow-md shadow-[#8B4513]/20"
            : "text-gray-600 hover:bg-gray-50 hover:text-[#8B4513]"
        )}
        title={item.label}
      >
        <Icon
          className={cn(
            "w-5 h-5 transition-all duration-300",
            isActive && "scale-110"
          )}
        />
        {orientation === "horizontal" && (
          <span className="text-xs font-semibold mt-1"></span>
        )}
        {/* Active indicator glow */}
        {isActive && (
          <span className="absolute inset-0 rounded-2xl bg-[#8B4513]/10 blur-lg -z-10" />
        )}
        {/* Tooltip on hover (desktop only) */}
        {orientation === "vertical" && (
          <span className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap shadow-xl z-50">
            {item.label}
            <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-gray-900 rotate-45 rounded-xl" />
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop vertical sidebar */}
      <aside className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-50">
        <nav className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100/50 p-3 flex flex-col gap-2 backdrop-blur-sm">
          {navItems.map((item) => renderLink(item, "vertical"))}
        </nav>
      </aside>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed inset-x-0 bottom-4 flex justify-center z-50 px-4">
        <nav className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-[0_12px_30px_rgba(0,0,0,0.15)] px-2 py-2 flex gap-2">
          {navItems.map((item) => renderLink(item, "horizontal"))}
        </nav>
      </div>
    </>
  );
}

