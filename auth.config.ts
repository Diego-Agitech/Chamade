import type { NextAuthConfig } from "next-auth";

export default {
  providers: [],
  secret:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "development" ? "dev-only-auth-secret-change-me" : undefined),
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized: ({ auth, request }) => {
      const pathname = request.nextUrl.pathname;
      const isLoggedIn = Boolean(auth?.user);

      const isPublicRoute =
        pathname === "/login" ||
        pathname === "/forgot-password" ||
        pathname.startsWith("/reset-password/") ||
        pathname.startsWith("/api/cron/") ||
        pathname.startsWith("/api/auth/");

      if (isPublicRoute) {
        if (isLoggedIn && (pathname === "/login" || pathname === "/forgot-password")) {
          return Response.redirect(new URL("/agenda", request.nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return Response.redirect(new URL("/login", request.nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
