import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Behind a proxy (Railway/Vercel) trust the forwarded host so callbacks and
  // redirects use the real public domain instead of NEXTAUTH_URL/localhost.
  trustHost: true,
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
        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role, adminPermissions: user.adminPermissions };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // Credentials login supplies adminPermissions; OAuth (adapter) may not,
        // so fetch from the DB when it's missing to avoid demoting staff.
        if (user.adminPermissions !== undefined) token.adminPermissions = user.adminPermissions || [];
        else if (user.id) {
          const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true, adminPermissions: true } });
          token.role = dbUser?.role ?? token.role;
          token.adminPermissions = dbUser?.adminPermissions || [];
        } else token.adminPermissions = [];
      }
      // Refresh staff permissions on demand (e.g. after an admin edits them).
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({ where: { id: token.id }, select: { role: true, adminPermissions: true } });
        if (fresh) { token.role = fresh.role; token.adminPermissions = fresh.adminPermissions || []; }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token && session.user) { session.user.id = token.id; session.user.role = token.role; session.user.adminPermissions = token.adminPermissions || []; }
      return session;
    },
  },
});

// Legacy compat export
export const authOptions = {};
