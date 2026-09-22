"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface JuryLoginFormProps {
  action: (
    state: { error?: string },
    formData: FormData,
  ) => Promise<{ error?: string }>;
}

const initialState = { error: undefined as string | undefined };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth loading={pending}>
      Enter Jury Portal
    </Button>
  );
}

export function JuryLoginForm({ action }: JuryLoginFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl"
    >
      <div>
        <label className="text-sm font-semibold text-white/80">
          Jury ID or Name
        </label>
        <Input
          name="identifier"
          placeholder="jury-anika"
          className="mt-2"
          required
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-white/80">Password</label>
        <Input
          name="password"
          type="password"
          placeholder="••••••"
          className="mt-2"
          required
        />
      </div>
      {state.error && (
        <p className="text-sm text-rose-400">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}

