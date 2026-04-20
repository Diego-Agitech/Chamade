"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { loginAction, type LoginFormState } from "@/app/login/actions";

const initialState: LoginFormState = {};

type LoginProfile = {
  id: string;
  name: string;
  email: string;
  color: string;
  emoji: string | null;
};

export function LoginForm({ profiles }: { profiles: LoginProfile[] }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(profiles[0]?.id ?? "");

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-700">Choisir un profil</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => setSelectedProfileId(profile.id)}
              className={`flex items-center gap-3 rounded-lg border p-2 text-left transition ${
                selectedProfileId === profile.id ? "border-zinc-900 bg-zinc-100" : "border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: profile.color }}
              >
                {profile.emoji?.trim() || profile.name.charAt(0).toUpperCase()}
              </span>
              <span>
                <span className="block text-sm font-medium text-zinc-900">{profile.name}</span>
                <span className="block text-xs text-zinc-500">{profile.email}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <input type="hidden" name="memberId" value={selectedProfileId} />

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none ring-0 transition focus:border-zinc-500"
          placeholder="********"
        />
      </div>

      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <Button type="submit" className="h-10 w-full" disabled={pending}>
        {pending ? "Connexion..." : "Se connecter"}
      </Button>

      <div className="text-center text-sm text-zinc-600">
        <Link href="/forgot-password" className="underline underline-offset-2 hover:text-zinc-900">
          Mot de passe oublié ?
        </Link>
      </div>
    </form>
  );
}
