import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentJury } from "@/lib/auth";
import { JURY_COOKIE } from "@/lib/config";

async function logoutAction() {
  "use server";
  const store = await cookies();
  store.delete(JURY_COOKIE);
  redirect("/jury/login");
}

export default async function JuryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jury = await getCurrentJury();

  return (
    <div className="min-h-screen bg-slate-950/95 text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-5 py-10 md:px-8">
        <header className="glass-panel flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <Badge tone="cyan">Jury Cockpit</Badge>
            <h1 className="text-2xl font-semibold">
              Hello, {jury?.name ?? "Jury"}
            </h1>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost">
              Logout
            </Button>
          </form>
        </header>
        <nav className="flex gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
          <Link
            href="/jury/programs"
            className="rounded-2xl px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
          >
            Assigned Programs
          </Link>
        </nav>
        <section className="space-y-8">{children}</section>
      </div>
    </div>
  );
}

