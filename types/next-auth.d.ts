import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      color: string;
      mustChangePassword: boolean;
    };
  }

  interface User {
    id: string;
    color: string;
    mustChangePassword: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    color: string;
    mustChangePassword: boolean;
  }
}
