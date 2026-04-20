"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  changePasswordAction,
  type PasswordFormState,
} from "@/app/(authenticated)/settings/password/actions";

const initialState: PasswordFormState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="currentPassword" className="text-sm font-medium text-zinc-700">
          Mot de passe actuel
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          minLength={8}
          className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none ring-0 transition focus:border-zinc-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="newPassword" className="text-sm font-medium text-zinc-700">
          Nouveau mot de passe
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none ring-0 transition focus:border-zinc-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-700">
          Confirmer le nouveau mot de passe
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none ring-0 transition focus:border-zinc-500"
        />
      </div>

      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <Button type="submit" className="h-10 w-full" disabled={pending}>
        {pending ? "Mise à jour..." : "Mettre à jour"}
      </Button>
    </form>
  );
}
