import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
        totpCode: { type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email as string } });
        if (!user?.password || user.status !== "ACTIVE") return null;
        const ok = await bcrypt.compare(credentials.password as string, user.password);
        if (!ok) return null;
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          if (!credentials.totpCode) throw new Error("2FA_REQUIRED");
          const speakeasy = require("speakeasy");
          const valid = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: "base32", token: credentials.totpCode, window: 2 });
          if (!valid) throw new Error("INVALID_2FA");
        }
        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) { token.id = user.id; token.role = user.role; }
      return token;
    },
    async session({ session, token }: any) {
      if (token && session.user) { session.user.id = token.id; session.user.role = token.role; }
      return session;
    },
  },
});

// Legacy compat export
export const authOptions = {};
