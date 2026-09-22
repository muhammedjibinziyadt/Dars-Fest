"use client";

import { useTransition } from "react";
import { showSuccess, showError } from "@/lib/toast";

interface ProgramFormWrapperProps {
  action: (formData: FormData) => Promise<void>;
  successMessage: string;
  children: React.ReactNode;
}

export function ProgramFormWrapper({
  action,
  successMessage,
  children,
}: ProgramFormWrapperProps) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        showSuccess(successMessage);
      } catch (error: any) {
        showError(error?.message || "An error occurred. Please try again.");
      }
    });
  }

  return (
    <form action={handleSubmit}>
      {children}
    </form>
  );
}

