import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Étend la structure de l'objet 'user' dans la session
   */
  interface Session {
    user: {
      uid?: string;
      role?: string;
      signature?: string;
    } & DefaultSession["user"];
  }

  /**
   * Étend l'objet 'User' renvoyé par le authorize
   */
  interface User {
    uid?: string;
    role?: string;
    signature?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Étend le jeton JWT pour inclure nos champs personnalisés
   */
  interface JWT {
    uid?: string;
    role?: string;
    signature?: string;
  }
}