"use server";

import { z } from "zod";
import { createPasswordResetToken } from "@/lib/db/auth";
import { sendPasswordResetEmail } from "@/lib/notifications/send";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide."),
});

export type ForgotPasswordFormState = {
  success?: string;
  error?: string;
};

export async function forgotPasswordAction(
  _: ForgotPasswordFormState,
  formData: FormData
): Promise<ForgotPasswordFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Email invalide." };
  }

  const tokenPayload = await createPasswordResetToken(parsed.data.email);
  if (tokenPayload) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password/${tokenPayload.token}`;

    await sendPasswordResetEmail({
      email: tokenPayload.email,
      resetUrl,
    });
  }

  return {
    success: "Si cet email existe, un lien de réinitialisation a été envoyé.",
  };
}
