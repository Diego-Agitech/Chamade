"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { forgotPasswordAction, type ForgotPasswordFormState } from "@/app/forgot-password/actions";

const initialState: ForgotPasswordFormState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none ring-0 transition focus:border-zinc-500"
          placeholder="mimi@chamade.fr"
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
        {pending ? "Envoi..." : "Envoyer le lien"}
      </Button>

      <div className="text-center text-sm text-zinc-600">
        <Link href="/login" className="underline underline-offset-2 hover:text-zinc-900">
          Retour à la connexion
        </Link>
      </div>
    </form>
  );
}
