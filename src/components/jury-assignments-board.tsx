"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Calendar, CheckCircle2, ClipboardList, Clock, Filter, Layers, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AssignedProgram } from "@/lib/types";

interface EnrichedAssignment {
  id: string;
  programId: string;
  programName: string;
  section: string;
  category: string;
  stage: boolean;
  status: AssignedProgram["status"];
}

const STATUS_CONFIG: Record<
  AssignedProgram["status"],
  { label: string; badgeClass: string; description: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    badgeClass: "bg-amber-500/20 text-amber-200 border-amber-500/30",
    description: "Awaiting evaluation",
    icon: Clock,
  },
  submitted: {
    label: "Submitted",
    badgeClass: "bg-sky-500/20 text-sky-200 border-sky-500/30",
    description: "Result submitted",
    icon: ClipboardList,
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
    description: "Review closed",
    icon: CheckCircle2,
  },
};

const FILTERS: Array<{ value: "all" | AssignedProgram["status"]; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "submitted", label: "Submitted" },
  { value: "completed", label: "Completed" },
];

export function JuryAssignmentsBoard({ assignments }: { assignments: EnrichedAssignment[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");

  const stats = useMemo(() => {
    const pending = assignments.filter((item) => item.status === "pending").length;
    const submitted = assignments.filter((item) => item.status === "submitted").length;
    const completed = assignments.filter((item) => item.status === "completed").length;
    return {
      total: assignments.length,
      pending,
      submitted,
      completed,
    };
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const matchesFilter = filter === "all" ? true : assignment.status === filter;
      const matchesQuery = assignment.programName.toLowerCase().includes(query.trim().toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [assignments, filter, query]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Assigned", value: stats.total, icon: Layers },
          { label: "Pending", value: stats.pending, icon: Clock },
          { label: "Submitted", value: stats.submitted, icon: ClipboardList },
          { label: "Completed", value: stats.completed, icon: CheckCircle2 },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-3xl border-white/10 bg-slate-900/70 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60">{stat.label}</p>
                <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
              </div>
              <stat.icon className="h-8 w-8 text-white/30" />
            </div>
          </Card>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center rounded-2xl border border-white/10 bg-white/5 px-4">
            <Search className="mr-2 h-4 w-4 text-white/50" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by program name..."
              className="border-0 bg-transparent px-0 text-white placeholder:text-white/50 focus-visible:ring-0"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={filter === item.value ? "secondary" : "ghost"}
                className={`gap-2 border border-white/10 ${filter === item.value ? "bg-white/20 text-white" : "text-white/70"}`}
                onClick={() => setFilter(item.value)}
              >
                {item.value === "all" ? <Filter className="h-4 w-4" /> : null}
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <Card className="rounded-3xl border-dashed border-white/10 bg-white/5 p-8 text-center text-white/70">
            <p>No programs match your filters.</p>
          </Card>
        ) : (
          filteredAssignments.map((assignment) => {
            const statusMeta = STATUS_CONFIG[assignment.status];
            const StatusIcon = statusMeta.icon;
            const isLocked = assignment.status !== "pending";

            return (
              <Card
                key={assignment.id}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-slate-900/30 p-5 text-white shadow-[0_20px_60px_rgba(8,47,73,0.35)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="cyan" className="text-xs">
                        #{assignment.programId.slice(0, 8)}
                      </Badge>
                      <div
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusMeta.badgeClass}`}
                      >
                        <StatusIcon className="h-4 w-4" />
                        {statusMeta.label}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold">{assignment.programName}</h3>
                    <p className="text-sm text-white/70">{statusMeta.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider text-white/70">
                      <span className="rounded-full border border-white/20 px-3 py-1">Section: {assignment.section}</span>
                      <span className="rounded-full border border-white/20 px-3 py-1">Cat {assignment.category}</span>
                      <span className="rounded-full border border-white/20 px-3 py-1">
                        {assignment.stage ? "On stage" : "Off stage"}
                      </span>
                    </div>
                  </div>
                  <div className="w-full lg:w-auto">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Status updated: {statusMeta.label}
                      </p>
                      <p className="text-xs text-white/50">Stay on track by submitting results promptly.</p>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row lg:flex-col">
                      {isLocked ? (
                        <Button variant="ghost" className="border border-white/10 text-white/60" disabled>
                          Already submitted
                        </Button>
                      ) : (
                        <Link href={`/jury/add-result/${assignment.programId}`} className="flex-1">
                          <Button className="w-full bg-emerald-500/80 text-white hover:bg-emerald-500">
                            Open result form
                          </Button>
                        </Link>
                      )}
                      <Button variant="secondary" className="w-full border border-white/10 text-white/80" disabled>
                        View briefing (coming soon)
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}


