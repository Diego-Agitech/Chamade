import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import authConfig from "@/auth.config";
import { verifyPassword } from "@/lib/auth/hash";

function normalizeAbsoluteUrl(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withProtocol).toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

const normalizedAuthUrl = normalizeAbsoluteUrl(process.env.AUTH_URL ?? process.env.NEXTAUTH_URL);
if (normalizedAuthUrl) {
  process.env.AUTH_URL = normalizedAuthUrl;
  process.env.NEXTAUTH_URL = normalizedAuthUrl;
}

type SessionUser = DefaultSession["user"] & {
  id: string;
  color: string;
  mustChangePassword: boolean;
};

const credentialsSchema = z.object({
  email: z.string().email().trim(),
  password: z.string().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: async (credentials) => {
        const { getMemberByEmail, updateLastLoginAt } = await import("@/lib/db/auth");

        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const member = await getMemberByEmail(parsed.data.email);
        if (!member) {
          return null;
        }

        const isValidPassword = await verifyPassword(parsed.data.password, member.passwordHash);
        if (!isValidPassword) {
          return null;
        }

        await updateLastLoginAt(member.id);

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          color: member.color,
          mustChangePassword: member.mustChangePassword ?? false,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.color = "color" in user ? String(user.color) : "#3b82f6";
        token.mustChangePassword =
          "mustChangePassword" in user ? Boolean(user.mustChangePassword) : false;
      }

      if (trigger === "update" && session?.mustChangePassword !== undefined) {
        token.mustChangePassword = session.mustChangePassword;
      }

      return token;
    },
    session: async ({ session, token }) => {
      session.user = {
        ...session.user,
        id: String(token.id),
        name: token.name ?? "",
        email: token.email ?? "",
        color: String(token.color),
        mustChangePassword: Boolean(token.mustChangePassword),
      } satisfies SessionUser;

      return session;
    },
  },
});
