"use client";

import { useTransition } from "react";
import { showSuccess, showError } from "@/lib/toast";

export function useActionWithToast() {
  const [isPending, startTransition] = useTransition();

  const execute = async (
    action: () => Promise<void>,
    successMessage: string,
  ) => {
    startTransition(async () => {
      try {
        await action();
        showSuccess(successMessage);
      } catch (error: any) {
        showError(error?.message || "An error occurred. Please try again.");
      }
    });
  };

  return { execute, isPending };
}

