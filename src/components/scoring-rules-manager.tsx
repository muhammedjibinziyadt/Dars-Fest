"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Award,
  CheckCircle2,
  HelpCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Sliders,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { showSuccess, showError } from "@/lib/toast";
import type { GradeType, Program, ProgramScoringConfig, ScoringRules, SectionType } from "@/lib/types";

interface ScoringRulesManagerProps {
  initialRules: ScoringRules;
  programs: Program[];
  saveGlobalRulesAction: (rules: ScoringRules) => Promise<{ success: boolean; error?: string }>;
  saveProgramConfigAction: (
    programId: string,
    config: ProgramScoringConfig
  ) => Promise<{ success: boolean; error?: string }>;
  resetProgramConfigAction: (
    programId: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export function ScoringRulesManager({
  initialRules,
  programs,
  saveGlobalRulesAction,
  saveProgramConfigAction,
  resetProgramConfigAction,
}: ScoringRulesManagerProps) {
  const [activeTab, setActiveTab] = useState<"global" | "programs">("global");
  const [isPending, startTransition] = useTransition();

  // Global Rules State
  const [globalRules, setGlobalRules] = useState<ScoringRules>(initialRules);

  // Selected Program for Override
  const [selectedProgramId, setSelectedProgramId] = useState<string>(programs[0]?.id || "");
  const [programSearch, setProgramSearch] = useState<string>("");
  const [onlyCustomFilter, setOnlyCustomFilter] = useState<boolean>(false);

  // Active selected program
  const selectedProgram = useMemo(
    () => programs.find((p) => p.id === selectedProgramId) || programs[0],
    [programs, selectedProgramId]
  );

  // Local state for the selected program's config
  const [programConfig, setProgramConfig] = useState<ProgramScoringConfig>(() => {
    if (selectedProgram?.scoringConfig) {
      return {
        useCustom: selectedProgram.scoringConfig.useCustom,
        positionScores: { ...(selectedProgram.scoringConfig.positionScores || {}) },
        gradeScores: {
          A: selectedProgram.scoringConfig.gradeScores?.A ?? 5,
          B: selectedProgram.scoringConfig.gradeScores?.B ?? 3,
          C: selectedProgram.scoringConfig.gradeScores?.C ?? 1,
          none: selectedProgram.scoringConfig.gradeScores?.none ?? 0,
        },
      };
    }
    return {
      useCustom: false,
      positionScores: { 1: 10, 2: 8, 3: 6 },
      gradeScores: { A: 5, B: 3, C: 1, none: 0 },
    };
  });

  // When selected program changes, update local config
  const handleSelectProgram = (prog: Program) => {
    setSelectedProgramId(prog.id);
    if (prog.scoringConfig) {
      setProgramConfig({
        useCustom: prog.scoringConfig.useCustom,
        positionScores: { ...(prog.scoringConfig.positionScores || {}) },
        gradeScores: {
          A: prog.scoringConfig.gradeScores?.A ?? 5,
          B: prog.scoringConfig.gradeScores?.B ?? 3,
          C: prog.scoringConfig.gradeScores?.C ?? 1,
          none: prog.scoringConfig.gradeScores?.none ?? 0,
        },
      });
    } else {
      // Default to section template
      const defaultPositions =
        prog.section === "single"
          ? { ...globalRules.single }
          : prog.section === "group"
          ? { ...globalRules.group }
          : { ...globalRules.general };

      setProgramConfig({
        useCustom: false,
        positionScores: defaultPositions,
        gradeScores: { ...globalRules.grades },
      });
    }
  };

  // Filtered programs for search
  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(programSearch.toLowerCase());
      const matchesCustom = onlyCustomFilter ? p.scoringConfig?.useCustom : true;
      return matchesSearch && matchesCustom;
    });
  }, [programs, programSearch, onlyCustomFilter]);

  // List of programs with custom scoring
  const customScoringPrograms = useMemo(() => {
    return programs.filter((p) => p.scoringConfig?.useCustom);
  }, [programs]);

  // Handle saving global rules
  const handleSaveGlobal = () => {
    startTransition(async () => {
      try {
        const res = await saveGlobalRulesAction(globalRules);
        if (res.success) {
          showSuccess("Global scoring matrix updated successfully!");
        } else {
          showError(res.error || "Failed to update global scoring rules");
        }
      } catch (err: any) {
        showError(err?.message || "An unexpected error occurred");
      }
    });
  };

  // Reset global rules to system defaults
  const handleResetGlobalDefaults = () => {
    if (!confirm("Are you sure you want to reset global scoring rules to system defaults?")) {
      return;
    }
    const defaults: ScoringRules = {
      single: { 1: 10, 2: 8, 3: 6 },
      group: { 1: 20, 2: 10 },
      general: { 1: 25, 2: 20, 3: 15 },
      grades: { A: 5, B: 3, C: 1, none: 0 },
    };
    setGlobalRules(defaults);
    startTransition(async () => {
      const res = await saveGlobalRulesAction(defaults);
      if (res.success) {
        showSuccess("Reset to standard festival scoring defaults!");
      }
    });
  };

  // Handle saving program custom rules
  const handleSaveProgramConfig = () => {
    if (!selectedProgram) return;
    startTransition(async () => {
      try {
        const res = await saveProgramConfigAction(selectedProgram.id, programConfig);
        if (res.success) {
          showSuccess(
            programConfig.useCustom
              ? `Custom scoring enabled for "${selectedProgram.name}"!`
              : `Scoring set to Global Defaults for "${selectedProgram.name}".`
          );
        } else {
          showError(res.error || "Failed to save program scoring rules");
        }
      } catch (err: any) {
        showError(err?.message || "An unexpected error occurred");
      }
    });
  };

  // Reset a program back to global default
  const handleResetProgramToDefault = (progId: string) => {
    startTransition(async () => {
      try {
        const res = await resetProgramConfigAction(progId);
        if (res.success) {
          if (selectedProgramId === progId) {
            setProgramConfig((prev) => ({ ...prev, useCustom: false }));
          }
          showSuccess("Program reverted to Global Scoring Defaults!");
        } else {
          showError(res.error || "Failed to reset program");
        }
      } catch (err: any) {
        showError(err?.message || "An unexpected error occurred");
      }
    });
  };

  // Calculator test state
  const [calcSection, setCalcSection] = useState<SectionType>("single");
  const [calcPos, setCalcPos] = useState<number>(1);
  const [calcGrade, setCalcGrade] = useState<GradeType>("A");

  const previewScore = useMemo(() => {
    const posPts = globalRules[calcSection]?.[calcPos] || 0;
    const gradePts = globalRules.grades?.[calcGrade] || 0;
    return { posPts, gradePts, total: posPts + gradePts };
  }, [globalRules, calcSection, calcPos, calcGrade]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Scoring Rules & Grade Points
            </h1>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
              Live Engine
            </Badge>
          </div>
          <p className="text-white/60 text-sm mt-1">
            Configure position scores and grade-based points globally or tailor custom rules for specific programs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-900 border border-white/10 p-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("global")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "global"
                ? "bg-amber-600 text-white shadow-md"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sliders className="w-4 h-4" />
            Global Defaults
          </button>
          <button
            onClick={() => setActiveTab("programs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "programs"
                ? "bg-amber-600 text-white shadow-md"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Zap className="w-4 h-4" />
            Program Overrides
            {customScoringPrograms.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-400 text-black font-bold rounded-full">
                {customScoringPrograms.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: GLOBAL DEFAULTS */}
      {activeTab === "global" && (
        <div className="space-y-6">
          {/* Quick Notice Banner */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5 flex items-start gap-3.5">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-300">
                How Festival Points Are Calculated
              </p>
              <p className="text-white/70 text-xs sm:text-sm mt-1">
                Candidate score is calculated as:{" "}
                <span className="text-amber-300 font-semibold font-mono">
                  [Position Points] + [Grade Points]
                </span>
                . If a program only uses positions or only uses grades, you can set the unused category to 0 points.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Single Events */}
            <Card className="border border-white/10 bg-slate-900/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-amber-300 flex items-center gap-2">
                    Single Events
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Individual student competitions
                  </CardDescription>
                </div>
                <Badge tone="cyan">Single</Badge>
              </div>

              <div className="space-y-3 pt-2">
                {[1, 2, 3, 4, 5].map((pos) => {
                  const val = globalRules.single[pos] ?? "";
                  return (
                    <div key={pos} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-white/80 font-medium">
                        {pos === 1 && "🥇 1st Place"}
                        {pos === 2 && "🥈 2nd Place"}
                        {pos === 3 && "🥉 3rd Place"}
                        {pos === 4 && "🏅 4th Place"}
                        {pos === 5 && "🏅 5th Place"}
                      </span>
                      <div className="flex items-center gap-1.5 w-28">
                        <Input
                          type="number"
                          min={0}
                          value={val}
                          onChange={(e) => {
                            const num = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                            setGlobalRules((prev) => ({
                              ...prev,
                              single: { ...prev.single, [pos]: Number.isNaN(num) ? 0 : num },
                            }));
                          }}
                          className="h-9 text-right font-mono"
                        />
                        <span className="text-xs text-white/40">pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 2. Group & General Events */}
            <Card className="border border-white/10 bg-slate-900/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-amber-300 flex items-center gap-2">
                    Group & General Events
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Team-wide and general stage events
                  </CardDescription>
                </div>
                <Badge tone="amber">Group / General</Badge>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                    Group Events
                  </p>
                  <div className="space-y-2.5">
                    {[1, 2, 3].map((pos) => (
                      <div key={pos} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-white/80 font-medium">
                          {pos === 1 && "🥇 1st Place"}
                          {pos === 2 && "🥈 2nd Place"}
                          {pos === 3 && "🥉 3rd Place"}
                        </span>
                        <div className="flex items-center gap-1.5 w-28">
                          <Input
                            type="number"
                            min={0}
                            value={globalRules.group[pos] ?? ""}
                            onChange={(e) => {
                              const num = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                              setGlobalRules((prev) => ({
                                ...prev,
                                group: { ...prev.group, [pos]: Number.isNaN(num) ? 0 : num },
                              }));
                            }}
                            className="h-9 text-right font-mono"
                          />
                          <span className="text-xs text-white/40">pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-3">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                    General Events
                  </p>
                  <div className="space-y-2.5">
                    {[1, 2, 3].map((pos) => (
                      <div key={pos} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-white/80 font-medium">
                          {pos === 1 && "🥇 1st Place"}
                          {pos === 2 && "🥈 2nd Place"}
                          {pos === 3 && "🥉 3rd Place"}
                        </span>
                        <div className="flex items-center gap-1.5 w-28">
                          <Input
                            type="number"
                            min={0}
                            value={globalRules.general[pos] ?? ""}
                            onChange={(e) => {
                              const num = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                              setGlobalRules((prev) => ({
                                ...prev,
                                general: { ...prev.general, [pos]: Number.isNaN(num) ? 0 : num },
                              }));
                            }}
                            className="h-9 text-right font-mono"
                          />
                          <span className="text-xs text-white/40">pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* 3. Grade-Based Points */}
            <Card className="border border-white/10 bg-slate-900/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-amber-300 flex items-center gap-2">
                    Grade-Based Points
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Points awarded for performance grades
                  </CardDescription>
                </div>
                <Badge tone="pink">Grades</Badge>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { grade: "A" as GradeType, label: "Grade A", tone: "bg-emerald-500/20 text-emerald-300" },
                  { grade: "B" as GradeType, label: "Grade B", tone: "bg-sky-500/20 text-sky-300" },
                  { grade: "C" as GradeType, label: "Grade C", tone: "bg-amber-500/20 text-amber-300" },
                  { grade: "none" as GradeType, label: "No Grade", tone: "bg-white/10 text-white/50" },
                ].map(({ grade, label, tone }) => (
                  <div key={grade} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${tone}`}>
                        {grade.toUpperCase()}
                      </span>
                      <span className="text-white/80 font-medium">{label}</span>
                    </span>
                    <div className="flex items-center gap-1.5 w-28">
                      <Input
                        type="number"
                        min={0}
                        disabled={grade === "none"}
                        value={globalRules.grades[grade] ?? 0}
                        onChange={(e) => {
                          const num = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                          setGlobalRules((prev) => ({
                            ...prev,
                            grades: { ...prev.grades, [grade]: Number.isNaN(num) ? 0 : num },
                          }));
                        }}
                        className="h-9 text-right font-mono"
                      />
                      <span className="text-xs text-white/40">pts</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculator Live Demo */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 mt-4 space-y-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Sample Score Preview
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={calcSection}
                    onChange={(e) => setCalcSection(e.target.value as SectionType)}
                    className="h-8 rounded bg-slate-950 border border-white/20 text-xs px-2 text-white"
                  >
                    <option value="single">Single</option>
                    <option value="group">Group</option>
                    <option value="general">General</option>
                  </select>
                  <select
                    value={calcPos}
                    onChange={(e) => setCalcPos(parseInt(e.target.value, 10))}
                    className="h-8 rounded bg-slate-950 border border-white/20 text-xs px-2 text-white"
                  >
                    <option value={1}>1st Place</option>
                    <option value={2}>2nd Place</option>
                    <option value={3}>3rd Place</option>
                  </select>
                  <select
                    value={calcGrade}
                    onChange={(e) => setCalcGrade(e.target.value as GradeType)}
                    className="h-8 rounded bg-slate-950 border border-white/20 text-xs px-2 text-white"
                  >
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                    <option value="none">No Grade</option>
                  </select>
                </div>
                <div className="pt-1 flex items-center justify-between text-xs text-white/80">
                  <span>
                    Pos: <strong className="text-amber-300">{previewScore.posPts}</strong> + Grade:{" "}
                    <strong className="text-emerald-300">{previewScore.gradePts}</strong>
                  </span>
                  <span className="text-sm font-bold text-amber-400">
                    Total: {previewScore.total} pts
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="secondary"
              onClick={handleResetGlobalDefaults}
              className="gap-2 text-xs sm:text-sm"
              disabled={isPending}
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </Button>

            <Button
              type="button"
              onClick={handleSaveGlobal}
              loading={isPending}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-6 py-2.5 gap-2"
            >
              <Save className="w-4 h-4" />
              Save Global Rules
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: PROGRAM-SPECIFIC OVERRIDES */}
      {activeTab === "programs" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-5 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold text-white text-base">
                Custom Program Scoring Overrides
              </h3>
              <p className="text-xs sm:text-sm text-white/60 mt-0.5">
                Some programs require custom points (e.g. higher stakes, special grade scales, or position-only points).
              </p>
            </div>
            {customScoringPrograms.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={onlyCustomFilter ? "default" : "secondary"}
                  onClick={() => setOnlyCustomFilter(!onlyCustomFilter)}
                  className="text-xs gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {onlyCustomFilter
                    ? "Showing Custom Only"
                    : `Show Only Overridden (${customScoringPrograms.length})`}
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left column: Program Selector */}
            <div className="lg:col-span-4 space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search programs..."
                  value={programSearch}
                  onChange={(e) => setProgramSearch(e.target.value)}
                  className="pl-9 h-10 bg-slate-900/80 border-white/10"
                />
              </div>

              <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1 rounded-xl">
                {filteredPrograms.length === 0 ? (
                  <p className="text-xs text-white/50 text-center py-8">
                    No programs match your search.
                  </p>
                ) : (
                  filteredPrograms.map((prog) => {
                    const isSelected = prog.id === selectedProgram?.id;
                    const hasCustom = prog.scoringConfig?.useCustom;
                    return (
                      <button
                        key={prog.id}
                        type="button"
                        onClick={() => handleSelectProgram(prog)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-amber-500/15 border-amber-500/50 shadow-md"
                            : "bg-slate-900/50 border-white/5 hover:border-white/20 hover:bg-slate-900"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">
                            {prog.name}
                          </p>
                          <p className="text-xs text-white/50 capitalize mt-0.5">
                            {prog.section} · {prog.stage ? "On Stage" : "Off Stage"}
                          </p>
                        </div>
                        {hasCustom ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                            Custom
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] text-white/40 shrink-0">
                            Default
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right column: Program Scoring Editor */}
            <div className="lg:col-span-8">
              {selectedProgram ? (
                <Card className="border border-white/10 bg-slate-900/70 p-5 sm:p-6 space-y-6">
                  {/* Selected Program Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white">
                          {selectedProgram.name}
                        </h2>
                        <Badge tone="cyan" className="capitalize">
                          {selectedProgram.section}
                        </Badge>
                      </div>
                      <p className="text-xs text-white/60 mt-1">
                        Configure specific rules that apply solely to this program during result publishing.
                      </p>
                    </div>

                    {/* Enable / Disable Custom Scoring Toggle */}
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant={programConfig.useCustom ? "default" : "outline"}
                        onClick={() =>
                          setProgramConfig((prev) => ({
                            ...prev,
                            useCustom: !prev.useCustom,
                          }))
                        }
                        className={`text-xs sm:text-sm font-semibold gap-2 ${
                          programConfig.useCustom
                            ? "bg-amber-600 hover:bg-amber-500 text-white"
                            : "border-white/20 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                        {programConfig.useCustom
                          ? "Custom Scoring: ENABLED"
                          : "Enable Custom Scoring"}
                      </Button>
                    </div>
                  </div>

                  {!programConfig.useCustom ? (
                    /* Default state explanation */
                    <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-8 text-center space-y-3">
                      <Sliders className="w-10 h-10 text-white/30 mx-auto" />
                      <h4 className="text-base font-semibold text-white/80">
                        Using Global Default Scoring
                      </h4>
                      <p className="text-xs sm:text-sm text-white/50 max-w-md mx-auto">
                        This program inherits the festival standard points for{" "}
                        <strong className="text-amber-300 capitalize">
                          {selectedProgram.section} Events
                        </strong>{" "}
                        (1st: {globalRules[selectedProgram.section]?.[1] || 0} pts, 2nd:{" "}
                        {globalRules[selectedProgram.section]?.[2] || 0} pts, 3rd:{" "}
                        {globalRules[selectedProgram.section]?.[3] || 0} pts) and grade points (A:{" "}
                        {globalRules.grades.A} pts, B: {globalRules.grades.B} pts).
                      </p>
                      <Button
                        type="button"
                        onClick={() =>
                          setProgramConfig((prev) => ({ ...prev, useCustom: true }))
                        }
                        className="mt-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                      >
                        Customize Points for this Program
                      </Button>
                    </div>
                  ) : (
                    /* Custom Points Editor */
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Position Points */}
                        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 space-y-3">
                          <h4 className="font-semibold text-amber-300 text-sm flex items-center justify-between">
                            <span>🏆 Custom Position Points</span>
                            <span className="text-xs text-white/40 font-normal">
                              Points by podium
                            </span>
                          </h4>

                          <div className="space-y-2.5 pt-1">
                            {[1, 2, 3, 4, 5].map((pos) => (
                              <div
                                key={pos}
                                className="flex items-center justify-between gap-3 text-sm"
                              >
                                <span className="text-white/80 font-medium">
                                  {pos === 1 && "🥇 1st Place"}
                                  {pos === 2 && "🥈 2nd Place"}
                                  {pos === 3 && "🥉 3rd Place"}
                                  {pos === 4 && "🏅 4th Place"}
                                  {pos === 5 && "🏅 5th Place"}
                                </span>
                                <div className="flex items-center gap-1.5 w-28">
                                  <Input
                                    type="number"
                                    min={0}
                                    value={programConfig.positionScores?.[pos] ?? ""}
                                    onChange={(e) => {
                                      const num =
                                        e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                                      setProgramConfig((prev) => ({
                                        ...prev,
                                        positionScores: {
                                          ...(prev.positionScores || {}),
                                          [pos]: Number.isNaN(num) ? 0 : num,
                                        },
                                      }));
                                    }}
                                    className="h-8 text-right font-mono"
                                  />
                                  <span className="text-xs text-white/40">pts</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Grade Points */}
                        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 space-y-3">
                          <h4 className="font-semibold text-amber-300 text-sm flex items-center justify-between">
                            <span>🎖️ Custom Grade Points</span>
                            <span className="text-xs text-white/40 font-normal">
                              Points by grade
                            </span>
                          </h4>

                          <div className="space-y-2.5 pt-1">
                            {[
                              { grade: "A" as GradeType, label: "Grade A", tone: "bg-emerald-500/20 text-emerald-300" },
                              { grade: "B" as GradeType, label: "Grade B", tone: "bg-sky-500/20 text-sky-300" },
                              { grade: "C" as GradeType, label: "Grade C", tone: "bg-amber-500/20 text-amber-300" },
                              { grade: "none" as GradeType, label: "No Grade", tone: "bg-white/10 text-white/50" },
                            ].map(({ grade, label, tone }) => (
                              <div
                                key={grade}
                                className="flex items-center justify-between gap-3 text-sm"
                              >
                                <span className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${tone}`}>
                                    {grade.toUpperCase()}
                                  </span>
                                  <span className="text-white/80 font-medium">{label}</span>
                                </span>
                                <div className="flex items-center gap-1.5 w-28">
                                  <Input
                                    type="number"
                                    min={0}
                                    disabled={grade === "none"}
                                    value={programConfig.gradeScores?.[grade] ?? 0}
                                    onChange={(e) => {
                                      const num =
                                        e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                                      setProgramConfig((prev) => ({
                                        ...prev,
                                        gradeScores: {
                                          A: prev.gradeScores?.A ?? 5,
                                          B: prev.gradeScores?.B ?? 3,
                                          C: prev.gradeScores?.C ?? 1,
                                          none: prev.gradeScores?.none ?? 0,
                                          [grade]: Number.isNaN(num) ? 0 : num,
                                        },
                                      }));
                                    }}
                                    className="h-8 text-right font-mono"
                                  />
                                  <span className="text-xs text-white/40">pts</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleResetProgramToDefault(selectedProgram.id)}
                          className="text-xs gap-1.5"
                          disabled={isPending}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Revert to Global Defaults
                        </Button>

                        <Button
                          type="button"
                          onClick={handleSaveProgramConfig}
                          loading={isPending}
                          className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-6 py-2 gap-2 text-xs sm:text-sm"
                        >
                          <Save className="w-4 h-4" />
                          Save Program Rules
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
