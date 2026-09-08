"use client";

import { useState, useTransition } from "react";
import { Award, Calculator, CheckCircle2, RotateCcw, Save, Sparkles, Trophy } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/lib/toast";
import type { ScoringRules } from "@/lib/types";

interface Props {
  initialRules: ScoringRules;
  saveAction: (rules: ScoringRules) => Promise<{ success: boolean; error?: string }>;
}

export function AddGradesManager({ initialRules, saveAction }: Props) {
  const [rules, setRules] = useState<ScoringRules>(initialRules);
  const [isPending, startTransition] = useTransition();

  // Test calculator state
  const [calcSection, setCalcSection] = useState<"single" | "group" | "general">("single");
  const [calcPosition, setCalcPosition] = useState<1 | 2 | 3>(1);
  const [calcGrade, setCalcGrade] = useState<"A" | "B" | "C" | "none">("A");

  const handleSingleChange = (field: keyof ScoringRules["single"], value: number) => {
    setRules((prev) => ({
      ...prev,
      single: {
        ...prev.single,
        [field]: Number.isNaN(value) ? 0 : value,
      },
    }));
  };

  const handleGroupChange = (field: keyof ScoringRules["group"], value: number) => {
    setRules((prev) => ({
      ...prev,
      group: {
        ...prev.group,
        [field]: Number.isNaN(value) ? 0 : value,
      },
    }));
  };

  const handleGeneralChange = (field: keyof ScoringRules["general"], value: number) => {
    setRules((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        [field]: Number.isNaN(value) ? 0 : value,
      },
    }));
  };

  const handleResetDefaults = () => {
    setRules({
      single: {
        first: 10,
        second: 7,
        third: 5,
        gradeA: 5,
        gradeB: 3,
        gradeC: 1,
      },
      group: {
        first: 20,
        second: 15,
        third: 10,
      },
      general: {
        first: 25,
        second: 20,
        third: 15,
      },
    });
    showSuccess("Reset values to standard defaults. Click save to persist.");
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const res = await saveAction(rules);
        if (res?.success) {
          showSuccess("Grade and score rules saved successfully!");
        } else {
          showError(res?.error || "Failed to save scoring rules.");
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred.";
        showError(message);
      }
    });
  };

  // Live calculator calculations
  const positionPoints =
    calcSection === "single"
      ? calcPosition === 1
        ? rules.single.first
        : calcPosition === 2
          ? rules.single.second
          : rules.single.third
      : calcSection === "group"
        ? calcPosition === 1
          ? rules.group.first
          : calcPosition === 2
            ? rules.group.second
            : rules.group.third
        : calcPosition === 1
          ? rules.general.first
          : calcPosition === 2
            ? rules.general.second
            : rules.general.third;

  const gradePoints =
    calcSection === "single"
      ? calcGrade === "A"
        ? rules.single.gradeA
        : calcGrade === "B"
          ? rules.single.gradeB
          : calcGrade === "C"
            ? rules.single.gradeC
            : 0
      : 0;

  const totalPoints = positionPoints + gradePoints;

  return (
    <div className="space-y-8 text-white">
      {/* Interactive Example & Live Score Calculator */}
      <Card className="border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/40 via-slate-900/60 to-purple-950/30 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/20 p-2.5 text-fuchsia-300">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Interactive Score Preview</CardTitle>
              <CardDescription className="text-white/70">
                Preview how placement points and grade bonus combine to calculate student & team points
              </CardDescription>
            </div>
          </div>
          <Badge tone="cyan">Live Calculator</Badge>
        </div>

        {/* Live Calculation Controls */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-2 block">
              Event Section
            </label>
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              {(["single", "group", "general"] as const).map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setCalcSection(sec)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize transition ${
                    calcSection === sec
                      ? "bg-fuchsia-600 text-white shadow"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-2 block">
              Podium Position
            </label>
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              {([1, 2, 3] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setCalcPosition(pos)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                    calcPosition === pos
                      ? "bg-amber-500 text-slate-950 shadow"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {pos === 1 ? "1st Place" : pos === 2 ? "2nd Place" : "3rd Place"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-2 block">
              Grade Awarded {calcSection !== "single" && "(Single events only)"}
            </label>
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              {(["A", "B", "C", "none"] as const).map((grd) => (
                <button
                  key={grd}
                  type="button"
                  disabled={calcSection !== "single"}
                  onClick={() => setCalcGrade(grd)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                    calcSection !== "single"
                      ? "opacity-40 cursor-not-allowed text-white/30"
                      : calcGrade === grd
                        ? "bg-emerald-500 text-slate-950 shadow"
                        : "text-white/60 hover:text-white"
                  }`}
                >
                  {grd === "none" ? "None" : `Grade ${grd}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calculation Result Breakdown Card */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/80 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">Point Breakdown</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm sm:text-base text-white/90">
                <span className="font-semibold text-amber-300">
                  {calcPosition === 1 ? "1st" : calcPosition === 2 ? "2nd" : "3rd"} Place ({positionPoints} pts)
                </span>
                {calcSection === "single" && (
                  <>
                    <span className="text-white/40">+</span>
                    <span className="font-semibold text-emerald-300">
                      {calcGrade === "none" ? "No Grade (0 pts)" : `Grade ${calcGrade} (+${gradePoints} pts)`}
                    </span>
                  </>
                )}
                <span className="text-white/40">=</span>
                <span className="text-xs text-white/50">Total Awarded:</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/10 px-5 py-2.5">
              <Sparkles className="h-5 w-5 text-fuchsia-300" />
              <div>
                <p className="text-xs text-fuchsia-200/70 uppercase tracking-widest font-semibold">Total Points</p>
                <p className="text-2xl font-bold text-white">{totalPoints} Points</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Scoring Rules Configuration Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Card 1: Single Events */}
        <Card className="space-y-5 border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Award className="h-5 w-5 text-fuchsia-400" />
              <CardTitle className="text-lg">Single Events</CardTitle>
            </div>
            <Badge tone="purple">Individual</Badge>
          </div>
          <CardDescription className="text-white/60">
            Points awarded to individual participants. Students get position points plus grade bonus.
          </CardDescription>

          <div className="space-y-4 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Podium Points</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/70 block mb-1">🥇 1st Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.single.first}
                  onChange={(e) => handleSingleChange("first", parseInt(e.target.value, 10))}
                  className="bg-slate-900/50 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">🥈 2nd Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.single.second}
                  onChange={(e) => handleSingleChange("second", parseInt(e.target.value, 10))}
                  className="bg-slate-900/50 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">🥉 3rd Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.single.third}
                  onChange={(e) => handleSingleChange("third", parseInt(e.target.value, 10))}
                  className="bg-slate-900/50 text-white"
                />
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300 pt-3 border-t border-white/10">
              Grade Bonus Points
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/70 block mb-1">🌟 Grade A Bonus</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.single.gradeA}
                  onChange={(e) => handleSingleChange("gradeA", parseInt(e.target.value, 10))}
                  className="bg-slate-900/50 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">⭐ Grade B Bonus</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.single.gradeB}
                  onChange={(e) => handleSingleChange("gradeB", parseInt(e.target.value, 10))}
                  className="bg-slate-900/50 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">✨ Grade C Bonus</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.single.gradeC}
                  onChange={(e) => handleSingleChange("gradeC", parseInt(e.target.value, 10))}
                  className="bg-slate-900/50 text-white"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Group Events */}
        <Card className="space-y-5 border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Trophy className="h-5 w-5 text-sky-400" />
              <CardTitle className="text-lg">Group Events</CardTitle>
            </div>
            <Badge tone="cyan">Team Event</Badge>
          </div>
          <CardDescription className="text-white/60">
            Points awarded to teams for group performances and ensemble competitions.
          </CardDescription>

          <div className="space-y-4 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">Podium Points</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/70 block mb-1">🥇 1st Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.group.first}
                  onChange={(e) => handleGroupChange("first", parseInt(e.target.value, 10))}
                  className="bg-slate-900/50 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">🥈 2nd Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.group.second}
                  onChange={(e) => handleGroupChange("second", parseInt(e.target.value, 10))}
                  className="bg-slate-900/50 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">🥉 3rd Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.group.third}
                  onChange={(e) => handleGroupChange("third", parseInt(e.target.value, 10))}
                  className="bg-slate-900/50 text-white"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: General Events */}
        <Card className="space-y-5 border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-lg">General Events</CardTitle>
            </div>
            <Badge tone="emerald">All-Fest</Badge>
          </div>
          <CardDescription className="text-white/60">
            Points awarded for general events, grand ceremonies, and major competitions.
          </CardDescription>

          <div className="space-y-4 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Podium Points</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/70 block mb-1">🥇 1st Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.general.first}
                  onChange={(e) => handleGeneralChange("first", parseInt(e.target.value, 10))}
                  className="bg-slate-900/50 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">🥈 2nd Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.general.second}
                  onChange={(e) => handleGeneralChange("second", parseInt(e.target.value, 10))}
                  className="bg-slate-900/50 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">🥉 3rd Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.general.third}
                  onChange={(e) => handleGeneralChange("third", parseInt(e.target.value, 10))}
                  className="bg-slate-900/50 text-white"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <Button
          type="button"
          variant="ghost"
          onClick={handleResetDefaults}
          disabled={isPending}
          className="gap-2 text-white/70 hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Standard Defaults
        </Button>

        <Button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="gap-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white px-6 font-semibold"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Saving changes..." : "Save Grade & Score Rules"}
        </Button>
      </div>
    </div>
  );
}
