"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileFormState } from "@/app/(authenticated)/settings/profile/actions";
import { Button } from "@/components/ui/button";

type ProfileSettingsFormProps = {
  email: string;
  emoji: string | null;
};

const initialState: ProfileFormState = {};

export function ProfileSettingsForm({ email, emoji }: ProfileSettingsFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="mt-6 max-w-md space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={email}
          className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none ring-0 transition focus:border-zinc-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="emoji" className="text-sm font-medium text-zinc-700">
          Avatar (emoji)
        </label>
        <input
          id="emoji"
          name="emoji"
          type="text"
          defaultValue={emoji ?? ""}
          placeholder="😀"
          maxLength={8}
          className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none ring-0 transition focus:border-zinc-500"
        />
      </div>

      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      {state.success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" className="h-10 w-full" disabled={pending}>
        {pending ? "Mise à jour..." : "Enregistrer"}
      </Button>
    </form>
  );
}
