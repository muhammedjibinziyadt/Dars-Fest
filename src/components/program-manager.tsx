"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, LayoutList, Search, Trash2, Eye, Pencil } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/ui/search-select";
import { Modal } from "@/components/ui/modal";
import { useDebounce } from "@/hooks/use-debounce";
import type { Jury, Program } from "@/lib/types";

interface ProgramManagerProps {
  programs: Program[];
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  bulkDeleteAction: (formData: FormData) => Promise<void>;
  bulkAssignAction: (formData: FormData) => Promise<void>;
  juries: Jury[];
  candidateCounts?: Record<string, number>;
}

type SortOption = "latest" | "az" | "category";

const sectionOptions = [
  { label: "All Sections", value: "" },
  { label: "Single", value: "single" },
  { label: "Group", value: "group" },
  { label: "General", value: "general" },
];

const categoryOptions = [
  { label: "All Categories", value: "" },
  { label: "Category A", value: "A" },
  { label: "Category B", value: "B" },
  { label: "Category C", value: "C" },
  { label: "None", value: "none" },
];

const stageOptions = [
  { label: "All Stages", value: "" },
  { label: "On Stage", value: "true" },
  { label: "Off Stage", value: "false" },
];

const pageSizeOptions = [
  { label: "6 / page", value: "6" },
  { label: "10 / page", value: "10" },
  { label: "20 / page", value: "20" },
];

// Submit button components that use form status
function UpdateSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="flex-1" loading={pending}>
      Save changes
    </Button>
  );
}

function DeleteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" size="sm" className="gap-2" loading={pending}>
      <Trash2 className="h-4 w-4" />
      Delete
    </Button>
  );
}

function BulkAssignSubmitButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={count === 0} loading={pending}>
      Assign {count} programs
    </Button>
  );
}

function BulkDeleteSubmitButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" className="w-full" disabled={count === 0} loading={pending}>
      Delete {count} program{count === 1 ? "" : "s"}
    </Button>
  );
}

export const ProgramManager = React.memo(function ProgramManager({
  programs,
  updateAction,
  deleteAction,
  bulkDeleteAction,
  bulkAssignAction,
  juries,
  candidateCounts = {},
}: ProgramManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [sectionFilter, setSectionFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [sort, setSort] = useState<SortOption>("latest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewProgram, setViewProgram] = useState<Program | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(Number(pageSizeOptions[0].value));
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const juryOptions = useMemo(
    () => juries.map((jury) => ({ value: jury.id, label: jury.name })),
    [juries],
  );
  const [selectedJuryId, setSelectedJuryId] = useState(juryOptions[0]?.value ?? "");

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, sectionFilter, categoryFilter, stageFilter, sort]);

  useEffect(() => {
    setSelectedJuryId(juryOptions[0]?.value ?? "");
  }, [juryOptions]);

  useEffect(() => {
    if (selected.size === 0) {
      setShowAssignModal(false);
      setShowDeleteModal(false);
    }
  }, [selected]);

  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      const matchesSearch = program.name.toLowerCase().includes(debouncedSearchQuery.trim().toLowerCase());
      const matchesSection = sectionFilter ? program.section === sectionFilter : true;
      const matchesCategory = categoryFilter ? program.category === categoryFilter : true;
      const matchesStage = stageFilter ? String(program.stage) === stageFilter : true;
      return matchesSearch && matchesSection && matchesCategory && matchesStage;
    });
  }, [programs, debouncedSearchQuery, sectionFilter, categoryFilter, stageFilter]);

  const sortedPrograms = useMemo(() => {
    const list = [...filteredPrograms];
    if (sort === "az") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "category") {
      list.sort((a, b) => a.category.localeCompare(b.category));
    } else {
      list.sort((a, b) => b.id.localeCompare(a.id));
    }
    return list;
  }, [filteredPrograms, sort]);

  useEffect(() => {
    const available = new Set(sortedPrograms.map((program) => program.id));
    setSelected((prev) => {
      const filtered = new Set(Array.from(prev).filter((id) => available.has(id)));
      return filtered.size === prev.size ? prev : filtered;
    });
  }, [sortedPrograms]);

  const toggleSelectOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const totalPages = Math.max(1, Math.ceil(sortedPrograms.length / pageSize)) || 1;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const startIndex = (page - 1) * pageSize;
  const visiblePrograms = sortedPrograms.slice(startIndex, startIndex + pageSize);
  const showingFrom = sortedPrograms.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + pageSize, sortedPrograms.length);
  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const selectedIdsValue = selectedIds.join(",");
  const hasSelection = selectedIds.length > 0;

  const toggleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelected(new Set(sortedPrograms.map((program) => program.id)));
    } else {
      setSelected(new Set());
    }
  }, [sortedPrograms]);

  const handleSortChange = useCallback((value: SortOption) => {
    setSort(value);
  }, []);

  const allSelected =
    sortedPrograms.length > 0 && sortedPrograms.every((program) => selected.has(program.id));

  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_20px_60px_rgba(8,47,73,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/50">Programs roster</p>
          <h2 className="text-2xl font-semibold text-white">Manage & curate events</h2>
          <p className="text-sm text-white/60">
            Search, filter, and bulk-select programs before assigning juries.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            disabled={!hasSelection || juries.length === 0}
            onClick={() => setShowAssignModal(true)}
          >
            <LayoutList className="h-4 w-4" />
            Bulk assign ({selected.size})
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="gap-2"
            disabled={!hasSelection}
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="h-4 w-4" />
            Bulk delete
          </Button>
        </div>
      </div>

      <div className="relative z-20 grid gap-3 md:grid-cols-4">
        <div className="relative z-20 md:col-span-2 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 transition-all duration-200 hover:border-white/20 focus-within:border-fuchsia-400/50 focus-within:ring-2 focus-within:ring-fuchsia-400/30 focus-within:bg-white/10">
          <Search className="mr-2 h-4 w-4 text-white/50 flex-shrink-0" />
          <Input
            type="text"
            placeholder="Search by program name"
            className="border-none bg-transparent px-0 placeholder:text-white/40"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <SearchSelect
          name="section_filter"
          options={sectionOptions}
          value={sectionFilter}
          onValueChange={setSectionFilter}
          placeholder="Filter by section"
        />
        <SearchSelect
          name="category_filter"
          options={categoryOptions}
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          placeholder="Filter by category"
        />
        <SearchSelect
          name="stage_filter"
          options={stageOptions}
          value={stageFilter}
          onValueChange={setStageFilter}
          placeholder="Filter by stage"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-white/50">Quick sort</span>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Latest First", value: "latest" },
            { label: "A-Z Name", value: "az" },
            { label: "Category", value: "category" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSortChange(option.value as SortOption)}
              className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
                sort === option.value
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "border border-white/10 text-white/60 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-4 text-sm text-white/60">
          <SearchSelect
            name="page_size"
            className="w-32"
            options={pageSizeOptions}
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
            placeholder="Page size"
          />
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          {sortedPrograms.length} programs
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-widest text-white/50">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) => toggleSelectAll(event.target.checked)}
            />
            Select all
          </div>
          <span className="flex-1">Program</span>
          <span>Meta</span>
          <span>Stage</span>
          <span>Actions</span>
        </div>

        {visiblePrograms.map((program) => {
          const isSelected = selected.has(program.id);
          const isEditing = editingId === program.id;
          const candidateLimit = program.candidateLimit ?? 1;
          const registrationCount = candidateCounts?.[program.id] ?? 0;
          return (
            <div
              key={program.id}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-800/40 px-4 py-4 shadow-[0_15px_60px_rgba(15,23,42,0.45)] transition hover:border-fuchsia-400/40"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectOne(program.id)}
                  />
                  <div>
                    <p className="text-sm text-white/40">#{program.id.slice(0, 8)}</p>
                    <p className="text-lg font-semibold text-white">{program.name}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide text-white/60 w-full xl:flex-1">
                  <span className="rounded-full border border-white/15 px-3 py-1 capitalize">
                    {program.section}
                  </span>
                  <span className="rounded-full border border-white/15 px-3 py-1">
                    Cat {program.category}
                  </span>
                  <span className="rounded-full border border-white/15 px-3 py-1">
                    {program.stage ? "On stage" : "Off stage"}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 ${
                      registrationCount >= candidateLimit
                        ? "border-amber-400 text-amber-200"
                        : "border-emerald-400/40 text-emerald-200"
                    }`}
                  >
                    Registered {registrationCount} / {candidateLimit}
                  </span>
                </div>
                <div className="text-sm text-white/70 w-full xl:w-auto">
                  Last updated · <span className="text-white/50">Auto</span>
                </div>
                <div className="flex flex-wrap gap-2 w-full xl:ml-auto xl:w-auto xl:justify-end" >
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                    onClick={() => setViewProgram(program)}
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2 border border-white/15 bg-white/5"
                    onClick={() => setEditingId((prev) => (prev === program.id ? null : program.id))}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={program.id} />
                    <DeleteSubmitButton />
                  </form>
                </div>
              </div>
              {isEditing && (
                <form
                  action={updateAction}
                  className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white md:grid-cols-2"
                >
                  <input type="hidden" name="id" value={program.id} />
                  <Input name="name" defaultValue={program.name} placeholder="Program name" />
                  <SearchSelect
                    name="section"
                    defaultValue={program.section}
                    options={[
                      { value: "single", label: "Single" },
                      { value: "group", label: "Group" },
                      { value: "general", label: "General" },
                    ]}
                    placeholder="Select section"
                  />
                  <SearchSelect
                    name="category"
                    defaultValue={program.category}
                    options={[
                      { value: "A", label: "Category A" },
                      { value: "B", label: "Category B" },
                      { value: "C", label: "Category C" },
                      { value: "none", label: "None" },
                    ]}
                    placeholder="Select category"
                  />
                  <SearchSelect
                    name="stage"
                    defaultValue={program.stage ? "true" : "false"}
                    options={[
                      { value: "true", label: "On Stage" },
                      { value: "false", label: "Off Stage" },
                    ]}
                    placeholder="Select stage"
                  />
                  <Input
                    name="candidateLimit"
                    type="number"
                    min={1}
                    defaultValue={candidateLimit}
                    placeholder="Candidate limit"
                  />
                  <div className="flex items-center gap-3 md:col-span-2">
                    <UpdateSubmitButton />
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
        {visiblePrograms.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/60">
            No programs match your filters.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
        <p>
          Showing{" "}
          <span className="font-semibold text-white">
            {sortedPrograms.length === 0 ? 0 : `${showingFrom}-${showingTo}`}
          </span>{" "}
          of <span className="font-semibold text-white">{sortedPrograms.length}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="border border-white/10 bg-white/5"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Prev
          </Button>
          <div className="rounded-xl border border-white/10 px-4 py-1 text-xs uppercase tracking-widest text-white/80">
            Page {page} of {totalPages}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="border border-white/10 bg-white/5"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages || sortedPrograms.length === 0}
          >
            Next
          </Button>
        </div>
      </div>

      <Modal
        open={Boolean(viewProgram)}
        onClose={() => setViewProgram(null)}
        title={viewProgram?.name ?? ""}
        actions={
          <Button variant="secondary" onClick={() => setViewProgram(null)}>
            Close
          </Button>
        }
      >
        {viewProgram && (
          <div className="space-y-3 text-sm text-white/80">
            <p>
              <span className="text-white/50">Program ID:</span> {viewProgram.id}
            </p>
            <p>
              <span className="text-white/50">Section:</span> {viewProgram.section}
            </p>
            <p>
              <span className="text-white/50">Category:</span> {viewProgram.category}
            </p>
            <p>
              <span className="text-white/50">Stage:</span>{" "}
              {viewProgram.stage ? "On stage" : "Off stage"}
            </p>
            <p>
              <span className="text-white/50">Candidate limit:</span>{" "}
              {viewProgram.candidateLimit ?? 1}
            </p>
          </div>
        )}
      </Modal>

      <Modal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Bulk assign programs"
        actions={
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
        }
      >
        {juries.length === 0 ? (
          <p className="text-sm text-white/70">No juries available for assignment.</p>
        ) : (
          <form action={bulkAssignAction} className="space-y-4">
            <input type="hidden" name="program_ids" value={selectedIdsValue} />
            <SearchSelect
              name="jury_id"
              options={juryOptions}
              value={selectedJuryId}
              onValueChange={setSelectedJuryId}
              required
              placeholder="Select jury"
            />
            <BulkAssignSubmitButton count={selected.size} />
          </form>
        )}
      </Modal>

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm bulk delete"
        actions={
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
        }
      >
        <p className="text-sm text-white/70">
          This will permanently remove {selected.size} program
          {selected.size === 1 ? "" : "s"}. This action cannot be undone.
        </p>
        <form action={bulkDeleteAction} className="space-y-4">
          <input type="hidden" name="program_ids" value={selectedIdsValue} />
          <BulkDeleteSubmitButton count={selected.size} />
        </form>
      </Modal>
    </div>
  );
});


