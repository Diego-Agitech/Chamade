"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { changePassword } from "@/lib/db/auth";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Mot de passe actuel invalide."),
    newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z.string().min(8, "La confirmation est requise."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type PasswordFormState = {
  error?: string;
};

export async function changePasswordAction(
  _: PasswordFormState,
  formData: FormData
): Promise<PasswordFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Session expirée. Reconnecte-toi." };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const result = await changePassword({
    memberId: session.user.id,
    currentPassword: parsed.data.currentPassword,
    newPassword: parsed.data.newPassword,
  });

  if (!result.ok) {
    if (result.reason === "invalid_current_password") {
      return { error: "Le mot de passe actuel est incorrect." };
    }
    if (result.reason === "same_password") {
      return { error: "Le nouveau mot de passe doit être différent de l'actuel." };
    }
    return { error: "Impossible de mettre à jour le mot de passe." };
  }

  redirect("/settings/password");
}
