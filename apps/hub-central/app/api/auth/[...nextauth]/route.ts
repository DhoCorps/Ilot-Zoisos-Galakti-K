import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase, UserModel } from "@ilot/infrastructure"; 
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "L'Îlot Zoizos",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Identifiants manquants.");
        }

        await connectToDatabase();

        // 🕵️ LA CORRECTION CRITIQUE : on ajoute .select("+password")
        // Sans cela, Mongoose ne renvoie pas le champ password et la comparaison échoue.
        const user = await UserModel.findOne({ 
          email: credentials.email.toLowerCase() 
        }).select("+password");
        
        if (!user) {
          throw new Error("Cet oiseau n'a pas encore de nid ici.");
        }

        // 🔍 Vérification du mot de passe
        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password as string
        );

        if (!isPasswordCorrect) {
          throw new Error("La clé ne correspond pas à la serrure.");
        }

        // ✨ Succès : On transmet les données à la session
        return {
          id: user._id.toString(),
          uid: user.uid || user._id.toString(),
          name: user.username,
          email: user.email,
          role: user.role || "BATISSEUR",
          signature: user.signature || "<(:<"
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as any).uid;
        token.role = (user as any).role;
        token.signature = (user as any).signature;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).uid = token.uid;
        (session.user as any).role = token.role;
        (session.user as any).signature = token.signature;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };