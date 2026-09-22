"use client";

import { useState } from "react";
import { ProfileCard } from "@/components/ui/profile-card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Jury } from "@/lib/types";

interface JuryCardWrapperProps {
  jury: Jury;
  assignmentCount: number;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function JuryCardWrapper({
  jury,
  assignmentCount,
  updateAction,
  deleteAction,
}: JuryCardWrapperProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use jury's avatar or fallback to default
  const avatarUrl = jury.avatar || "/img/jury.webp";

  const handleDelete = async () => {
    setIsDeleting(true);
    const formData = new FormData();
    formData.append("id", jury.id);
    await deleteAction(formData);
    setIsDeleting(false);
    setShowDeleteModal(false);
  };

  return (
    <>
      <ProfileCard
        name={jury.name}
        role="Event Judge"
        avatarSrc={avatarUrl}
        statusText="Active"
        statusColor="bg-emerald-500"
        juryId={jury.id}
        password={jury.password}
        assignmentCount={assignmentCount}
        onEdit={() => setShowEditModal(true)}
        onDelete={() => setShowDeleteModal(true)}
        onCopyPassword={() => {}}
        className="w-full"
      />

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Jury Member"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-jury-form"
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form id="edit-jury-form" action={updateAction} className="space-y-4">
          <input type="hidden" name="id" value={jury.id} />
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Full Name
            </label>
            <Input name="name" defaultValue={jury.name} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Password
            </label>
            <Input name="password" type="password" defaultValue={jury.password} required minLength={4} />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        title="Delete Jury Member"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-white/80">
          Are you sure you want to delete <strong>{jury.name}</strong>? This action cannot be undone.
        </p>
        {assignmentCount > 0 && (
          <p className="mt-2 text-sm text-amber-300">
            Warning: This jury member has {assignmentCount} assigned program{assignmentCount !== 1 ? "s" : ""}.
          </p>
        )}
      </Modal>
    </>
  );
}

