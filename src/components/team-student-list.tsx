"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Eye, 
  Pencil, 
  Trash2, 
  X, 
  Check,
  User,
  Hash,
  Search,
  Lock
} from "lucide-react";
import type { PortalStudent } from "@/lib/types";

interface Props {
  students: PortalStudent[];
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  isRegistrationOpen: boolean;
}

export function TeamStudentList({ students, updateAction, deleteAction, isRegistrationOpen }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editChestNumber, setEditChestNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) {
      return students;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return students.filter((student) => {
      const nameMatch = student.name.toLowerCase().includes(query);
      const chestMatch = student.chestNumber.toLowerCase().includes(query);
      const teamMatch = student.teamName.toLowerCase().includes(query);
      return nameMatch || chestMatch || teamMatch;
    });
  }, [students, searchQuery]);

  const handleEdit = (student: PortalStudent) => {
    setEditingId(student.id);
    setEditName(student.name);
    setEditChestNumber(student.chestNumber);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditName("");
    setEditChestNumber("");
  };

  const handleSave = async (studentId: string) => {
    const formData = new FormData();
    formData.append("studentId", studentId);
    formData.append("name", editName.trim());
    formData.append("chestNumber", editChestNumber.trim().toUpperCase());
    await updateAction(formData);
    setEditingId(null);
    setEditName("");
    setEditChestNumber("");
  };

  const handleDelete = async (studentId: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      const formData = new FormData();
      formData.append("studentId", studentId);
      await deleteAction(formData);
    }
  };

  if (students.length === 0) {
    return (
      <Card className="rounded-2xl border-white/10 bg-white/5 p-8 text-center text-white">
        <User className="mx-auto h-12 w-12 text-white/30 mb-4" />
        <p className="text-sm text-white/60">No students added yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input
          type="text"
          placeholder="Search by name, chest number, or team..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="text-sm text-white/60 px-1">
          {filteredStudents.length === 0 ? (
            <span>No students found matching "{searchQuery}"</span>
          ) : (
            <span>
              Found {filteredStudents.length} of {students.length} student{students.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Students List */}
      {filteredStudents.length === 0 && searchQuery ? (
        <Card className="rounded-2xl border-white/10 bg-white/5 p-8 text-center text-white">
          <Search className="mx-auto h-12 w-12 text-white/30 mb-4" />
          <p className="text-sm text-white/60 mb-2">No results found</p>
          <p className="text-xs text-white/40">Try a different search term</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student) => {
        const isEditing = editingId === student.id;
        const isViewing = viewingId === student.id;

        return (
          <Card
            key={student.id}
            className="rounded-2xl group border border-white/10 bg-white/5 p-4 text-white transition-all hover:bg-white/10 hover:border-white/20"
          >
            {isEditing ? (
              // Edit Mode
              <div className="space-y-3">
                {!isRegistrationOpen && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-3">
                    <Lock className="h-4 w-4 text-amber-400" />
                    <p className="text-xs text-amber-300">Registration window is closed. Changes cannot be saved.</p>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white/70">Editing Student</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-white/60 mb-1.5 block">Student Name</label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Student name"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/60 mb-1.5 block">Chest Number</label>
                    <Input
                      value={editChestNumber}
                      onChange={(e) => setEditChestNumber(e.target.value.toUpperCase())}
                      placeholder="Chest number"
                      className="bg-white/10 border-white/20 text-white"
                      maxLength={10}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSave(student.id)}
                    disabled={!isRegistrationOpen}
                    className="flex-1"
                    size="sm"
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    Save Changes
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCancel}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-2.5 shrink-0">
                    <User className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{student.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-white/60">
                      <Hash className="h-3 w-3" />
                      <span className="font-mono">{student.chestNumber}</span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingId(isViewing ? null : student.id)}
                    className="h-9 w-9 p-0 hover:bg-cyan-500/20 hover:text-cyan-300"
                    title="View details"
                  >
                    <Eye className={`h-4 w-4 ${isViewing ? 'text-cyan-400' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(student)}
                    disabled={!isRegistrationOpen}
                    className="h-9 w-9 p-0 hover:bg-emerald-500/20 hover:text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={isRegistrationOpen ? "Edit student" : "Registration window is closed"}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(student.id)}
                    disabled={!isRegistrationOpen}
                    className="h-9 w-9 p-0 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={isRegistrationOpen ? "Delete student" : "Registration window is closed"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* View Details Panel */}
            {isViewing && !isEditing && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-white/60 mb-1">Student Name</p>
                    <p className="font-medium text-white">{student.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 mb-1">Chest Number</p>
                    <p className="font-mono font-medium text-white">{student.chestNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 mb-1">Team</p>
                    <p className="font-medium text-white">{student.teamName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 mb-1">Total Points</p>
                    <p className="font-medium text-white">{student.score || 0}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingId(null)}
                  className="mt-4 w-full"
                >
                  Close Details
                </Button>
              </div>
            )}
          </Card>
          );
        })}
        </div>
      )}
    </div>
  );
}
