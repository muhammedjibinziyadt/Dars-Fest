"use client";

import { FormEvent, ReactNode } from "react";
import { useTransition } from "react";
import { showSuccess, showError } from "@/lib/toast";

interface ActionFormWrapperProps {
  action: (formData: FormData) => Promise<void>;
  successMessage: string;
  children: ReactNode;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function ActionFormWrapper({
  action,
  successMessage,
  children,
  onSuccess,
  onError,
}: ActionFormWrapperProps) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await action(formData);
        showSuccess(successMessage);
        onSuccess?.();
        // Reset form on success
        e.currentTarget.reset();
      } catch (error: any) {
        const errorMessage = error?.message || "An error occurred. Please try again.";
        showError(errorMessage);
        onError?.(error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {children}
    </form>
  );
}

