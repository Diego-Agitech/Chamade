"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { resetPasswordWithToken } from "@/lib/db/auth";

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z.string().min(8, "La confirmation est requise."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormState = {
  error?: string;
};

export async function resetPasswordAction(
  _: ResetPasswordFormState,
  formData: FormData
): Promise<ResetPasswordFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const result = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!result.ok) {
    return { error: "Lien invalide ou expiré. Demande un nouveau lien." };
  }

  redirect("/login?reset=success");
}
