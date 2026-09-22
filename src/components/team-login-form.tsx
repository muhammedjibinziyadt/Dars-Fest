"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface LoginState {
  error?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending}>
      Sign in
    </Button>
  );
}

export function TeamLoginForm({
  action,
}: {
  action: (state: LoginState, formData: FormData) => Promise<LoginState>;
}) {
  const [state, formAction] = useFormState(action, {});

  return (
    <Card className="max-w-lg border-white/10 bg-white/5 p-6 text-white">
      <CardTitle>Team Login</CardTitle>
      <CardDescription className="mt-2 text-white/70">
        Enter your team name and password to access the portal.
      </CardDescription>
      <form action={formAction} className="mt-6 space-y-4">
        <Input name="teamName" placeholder="Team name" required />
        <Input name="password" type="password" placeholder="Password" required />
        {state.error && <p className="text-sm text-red-400">{state.error}</p>}
        <SubmitButton />
      </form>
    </Card>
  );
}

