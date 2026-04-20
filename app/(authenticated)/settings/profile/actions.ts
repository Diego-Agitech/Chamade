"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { isEmailUsedByAnotherMember, updateMemberProfileSettings } from "@/lib/db/settings";

const updateProfileSchema = z.object({
  email: z.string().trim().email("Format d'email invalide."),
  emoji: z
    .string()
    .trim()
    .max(8, "Emoji invalide.")
    .optional()
    .transform((value) => value ?? ""),
});

export type ProfileFormState = {
  error?: string;
  success?: string;
};

export async function updateProfileAction(
  _: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Session expirée. Reconnecte-toi." };
  }

  const parsed = updateProfileSchema.safeParse({
    email: formData.get("email"),
    emoji: formData.get("emoji"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const email = parsed.data.email.toLowerCase();
  const emoji = parsed.data.emoji.length > 0 ? parsed.data.emoji : null;

  const emailAlreadyUsed = await isEmailUsedByAnotherMember(session.user.id, email);
  if (emailAlreadyUsed) {
    return { error: "Cet email est déjà utilisé." };
  }

  await updateMemberProfileSettings({
    memberId: session.user.id,
    email,
    emoji,
  });

  revalidatePath("/settings/profile");
  revalidatePath("/settings/session");

  return { success: "Profil mis à jour." };
}
