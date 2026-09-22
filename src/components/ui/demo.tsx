"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BadgeCheck,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  Hourglass,
  LayoutDashboard,
  Layers,
  Menu,
  PenSquare,
  type LucideIcon,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface SidebarChild {
  label: string;
  href: string;
}

const ICONS = {
  dashboard: LayoutDashboard,
  programs: Layers,
  students: GraduationCap,
  jury: Users,
  teams: Users,
  assignments: ClipboardCheck,
  addResult: PenSquare,
  pending: Hourglass,
  approved: BadgeCheck,
} satisfies Record<string, LucideIcon>;

type IconName = keyof typeof ICONS;

export interface SidebarItem {
  label: string;
  href?: string;
  icon?: IconName;
  children?: SidebarChild[];
}

interface SidenavbarProps {
  items: SidebarItem[];
  heading?: string;
  children?: ReactNode;
}

export default function Sidenavbar({
  items,
  heading = "Menu",
  children,
}: SidenavbarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col gap-4">
      {/* Mobile navbar + drawer menu */}
      <div className="flex flex-col gap-4 md:hidden">
        <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-lg font-semibold text-white">{heading}</span>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="border border-white/10 bg-white/5 hover:bg-white/10"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 border-none bg-slate-950 p-0">
              <ScrollArea className="h-full py-4">
                <nav className="space-y-1 px-3">
                  {items.map((item) => {
                    const IconComponent = item.icon ? ICONS[item.icon] : undefined;
                    return (
                      <Button
                        key={item.href ?? item.label}
                        variant="ghost"
                        className="w-full justify-start"
                        asChild
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link
                          href={item.href ?? "#"}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm",
                            pathname?.startsWith(item.href ?? "") &&
                              "bg-white/10 text-white",
                          )}
                        >
                          {IconComponent && (
                            <IconComponent className="h-4 w-4 shrink-0" />
                          )}
                          <span>{item.label}</span>
                        </Link>
                      </Button>
                    );
                  })}
                </nav>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1">{children}</main>
      </div>

      {/* Desktop sidebar layout */}
      <div className="hidden min-h-screen gap-6 md:flex relative">
        <aside
          className={cn(
            "fixed left-4 top-10 bottom-10 z-50 flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 ease-in-out shadow-2xl shadow-black/20",
            isOpen ? "w-64" : "w-20",
          )}
        >
          <div
            className={cn(
              "flex h-16 items-center border-b border-white/10 ",
              isOpen ? "justify-between px-4" : "justify-center px-3",
            )}
          >
            <span
              className={cn(
                "text-lg font-semibold text-white transition-opacity",
                isOpen ? "opacity-100" : "hidden",
              )}
            >
              {heading}
            </span>
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen((prev) => !prev)}
              className="shrink-0 border border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <nav className="p-3 space-y-1">
              {items.map((item) => {
                const IconComponent = item.icon ? ICONS[item.icon] : undefined;
                const isActive = pathname?.startsWith(item.href ?? "");
                const hasActiveChild = item.children?.some((child) => 
                  pathname?.startsWith(child.href)
                ) ?? false;
                
                return item.children && item.children.length > 0 ? (
                  <Collapsible 
                    key={item.label} 
                    className="space-y-1" 
                    defaultOpen={hasActiveChild && isOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full rounded-2xl h-10",
                          isActive && "bg-white/10 text-white",
                          !isActive && "text-white/70 hover:bg-white/10 hover:text-white",
                          !isOpen ? "justify-center px-0" : "justify-start px-3",
                        )}
                        title={!isOpen ? item.label : undefined}
                      >
                        {IconComponent && (
                          <IconComponent className={cn(
                            "shrink-0 text-white",
                            isOpen ? "h-4 w-4" : "h-5 w-5"
                          )} />
                        )}
                        {isOpen && (
                          <>
                            <span className="flex-1 text-left ml-2">{item.label}</span>
                            <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-90" />
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    {isOpen && (
                      <CollapsibleContent className="ml-2 space-y-1 mt-1">
                        {item.children.map((child) => (
                          <Button
                            key={child.href}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full justify-start rounded-2xl h-9 text-white/80",
                              pathname?.startsWith(child.href) &&
                                "bg-white/10 text-white",
                              !pathname?.startsWith(child.href) && "hover:bg-white/10 hover:text-white"
                            )}
                            asChild
                          >
                            <Link href={child.href} className="w-full flex items-center">{child.label}</Link>
                          </Button>
                        ))}
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                ) : (
                  <Button
                    key={item.href ?? item.label}
                    variant="ghost"
                    className={cn(
                      "w-full rounded-2xl h-10",
                      pathname?.startsWith(item.href ?? "") &&
                        "bg-white/10 text-white",
                      !pathname?.startsWith(item.href ?? "") && "text-white/70 hover:bg-white/10 hover:text-white",
                      !isOpen ? "justify-center px-0" : "justify-start px-3",
                    )}
                    asChild
                  >
                    <Link
                      href={item.href ?? "#"}
                      className={cn(
                        "flex w-full items-center",
                        isOpen ? "gap-3 justify-start" : "justify-center"
                      )}
                      title={!isOpen ? item.label : undefined}
                    >
                      {IconComponent && (
                        <IconComponent
                          className={cn(
                            "shrink-0 text-white",
                            isOpen ? "h-4 w-4" : "h-5 w-5"
                          )}
                        />
                      )}
                      {isOpen && <span className="flex-1 text-left ml-0">{item.label}</span>}
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>
        <main className={cn(
          "flex-1 w-full transition-all duration-300 ease-in-out",
          isOpen ? "ml-[18.5rem]" : "ml-[7.5rem]"
        )}>{children}</main>
      </div>
    </div>
  );
}

