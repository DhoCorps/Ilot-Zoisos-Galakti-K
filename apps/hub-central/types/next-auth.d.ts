import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      uid?: string;
      role?: string;
      signature?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    uid?: string;
    role?: string;
    signature?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    uid?: string;
    role?: string;
    signature?: string;
  }
}