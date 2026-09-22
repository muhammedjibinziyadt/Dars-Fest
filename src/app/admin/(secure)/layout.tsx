import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Sidenavbar, {
  type SidebarItem,
} from "@/components/ui/demo";
import { ADMIN_COOKIE } from "@/lib/config";

const adminNav: SidebarItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/programs", label: "Programs", icon: "programs" },
  { href: "/admin/students", label: "Students", icon: "students" },
  { href: "/admin/jury", label: "Jury", icon: "jury" },
  { href: "/admin/assign", label: "Assignments", icon: "assignments" },
  { href: "/admin/add-result", label: "Add Result", icon: "addResult" },
  { href: "/admin/pending-results", label: "Pending Results", icon: "pending" },
  { href: "/admin/approved-results", label: "Approved Results", icon: "approved" },
  {
    href: "/admin/team-portal-control",
    label: "Team Portal",
    icon: "teams",
    children: [
      { href: "/admin/team-portal-control", label: "Control Panel" },
      { href: "/admin/team-details", label: "Team Details" },
      { href: "/admin/request-approvals", label: "Request Approvals" },
    ],
  },
];

async function logoutAction() {
  "use server";
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export default function AdminSecureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950/95 text-white">
      <Sidenavbar items={adminNav} heading="Admin Control">
        <div className="flex min-h-screen flex-col gap-8 px-5 py-6 md:px-8 md:py-10">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-6 py-4 shadow-lg">
            <div>
              <p className="text-xs uppercase text-white/60">Admin Deck</p>
              <h1 className="text-2xl font-semibold">Fest Command Center</h1>
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" className="hover:bg-white/10">
                Sign out
              </Button>
            </form>
          </header>
          <section className="space-y-10">{children}</section>
        </div>
      </Sidenavbar>
    </div>
  );
}

