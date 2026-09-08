"use client";

import { useState, useTransition } from "react";
import { Award, Calculator, RotateCcw, Save, Sparkles, Trophy, CheckCircle2 } from "lucide-react";
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
          showSuccess("Grade and scoring rules saved successfully!");
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
    <div className="space-y-8">
      
      {/* 1. Interactive Example & Live Score Calculator */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/80">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Interactive Score Preview</CardTitle>
              <CardDescription className="mt-1">
                Preview how placement points and grade bonus combine to calculate student & team points
              </CardDescription>
            </div>
          </div>
          <Badge tone="cyan">Live Calculator</Badge>
        </div>

        {/* Live Calculation Controls */}
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
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
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize transition-all ${
                    calcSection === sec
                      ? "bg-white/15 text-white font-bold border border-white/15 shadow-sm"
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
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    calcPosition === pos
                      ? "bg-white/15 text-white font-bold border border-white/15 shadow-sm"
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
              Grade Awarded {calcSection !== "single" && "(Single only)"}
            </label>
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              {(["A", "B", "C", "none"] as const).map((grade) => (
                <button
                  key={grade}
                  type="button"
                  disabled={calcSection !== "single"}
                  onClick={() => setCalcGrade(grade)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold uppercase transition-all disabled:opacity-30 ${
                    calcGrade === grade && calcSection === "single"
                      ? "bg-white/15 text-white font-bold border border-white/15 shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {grade === "none" ? "None" : `Grade ${grade}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Calculation Output Preview Banner */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Point Breakdown</p>
            <p className="text-sm font-medium text-white/90">
              <span className="font-semibold text-white">
                {calcPosition === 1 ? "1st Place" : calcPosition === 2 ? "2nd Place" : "3rd Place"} ({positionPoints} pts)
              </span>
              {calcSection === "single" && (
                <>
                  <span className="text-white/40 mx-2">+</span>
                  <span className="font-semibold text-white">
                    {calcGrade !== "none" ? `Grade ${calcGrade} (+${gradePoints} pts)` : "No Grade (+0 pts)"}
                  </span>
                </>
              )}
              <span className="text-white/40 mx-2">=</span>
              <span className="text-white/70">Total Awarded</span>
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 shrink-0">
            <Sparkles className="h-4 w-4 text-fuchsia-400" />
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">Total Points</p>
              <p className="text-xl font-bold text-white">{totalPoints} Points</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Main Scoring Rules Configuration Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Card 1: Single Events */}
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Award className="h-5 w-5 text-fuchsia-400" />
              <CardTitle>Single Events</CardTitle>
            </div>
            <Badge tone="pink">Individual</Badge>
          </div>
          <CardDescription>
            Points awarded to individual participants. Students get position points plus grade bonus.
          </CardDescription>

          <div className="space-y-4 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Podium Points</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/70 block mb-1">1st Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.single.first}
                  onChange={(e) => handleSingleChange("first", parseInt(e.target.value, 10))}
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">2nd Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.single.second}
                  onChange={(e) => handleSingleChange("second", parseInt(e.target.value, 10))}
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">3rd Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.single.third}
                  onChange={(e) => handleSingleChange("third", parseInt(e.target.value, 10))}
                />
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-white/70 pt-3 border-t border-white/10">
              Grade Bonus Points
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/70 block mb-1">Grade A Bonus</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.single.gradeA}
                  onChange={(e) => handleSingleChange("gradeA", parseInt(e.target.value, 10))}
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">Grade B Bonus</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.single.gradeB}
                  onChange={(e) => handleSingleChange("gradeB", parseInt(e.target.value, 10))}
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">Grade C Bonus</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.single.gradeC}
                  onChange={(e) => handleSingleChange("gradeC", parseInt(e.target.value, 10))}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Group Events */}
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Trophy className="h-5 w-5 text-cyan-400" />
              <CardTitle>Group Events</CardTitle>
            </div>
            <Badge tone="cyan">Team Event</Badge>
          </div>
          <CardDescription>
            Points awarded to teams for group performances and ensemble competitions.
          </CardDescription>

          <div className="space-y-4 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Podium Points</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/70 block mb-1">1st Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.group.first}
                  onChange={(e) => handleGroupChange("first", parseInt(e.target.value, 10))}
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">2nd Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.group.second}
                  onChange={(e) => handleGroupChange("second", parseInt(e.target.value, 10))}
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">3rd Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.group.third}
                  onChange={(e) => handleGroupChange("third", parseInt(e.target.value, 10))}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: General Events */}
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <CardTitle>General Events</CardTitle>
            </div>
            <Badge tone="emerald">All-Fest</Badge>
          </div>
          <CardDescription>
            Points awarded for general events, grand ceremonies, and major competitions.
          </CardDescription>

          <div className="space-y-4 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Podium Points</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/70 block mb-1">1st Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.general.first}
                  onChange={(e) => handleGeneralChange("first", parseInt(e.target.value, 10))}
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">2nd Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.general.second}
                  onChange={(e) => handleGeneralChange("second", parseInt(e.target.value, 10))}
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">3rd Place Points</label>
                <Input
                  type="number"
                  min={0}
                  value={rules.general.third}
                  onChange={(e) => handleGeneralChange("third", parseInt(e.target.value, 10))}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Action Bar */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
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
          className="gap-2 px-6 font-semibold shadow-lg"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Saving changes..." : "Save Grade & Scoring Rules"}
        </Button>
      </Card>
    </div>
  );
}
