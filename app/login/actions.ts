"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/auth";
import { getMemberById } from "@/lib/db/auth";

const loginSchema = z.object({
  memberId: z.string().optional(),
  email: z.string().email("Email invalide.").optional(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

export type LoginFormState = {
  error?: string;
};

export async function loginAction(_: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    memberId: formData.get("memberId"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  let email = parsed.data.email ?? "";
  if (parsed.data.memberId) {
    const member = await getMemberById(parsed.data.memberId);
    if (!member) {
      return { error: "Profil introuvable." };
    }
    email = member.email;
  }
  if (!email) {
    return { error: "Email manquant." };
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect." };
    }

    throw error;
  }
}
