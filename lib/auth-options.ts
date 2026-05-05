/**
 * NextAuth options — extracted here so they can be imported
 * from lib/ without path issues from the [...nextauth] directory.
 */
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { devAddressFromEmail } from "@/lib/zklogin";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    CredentialsProvider({
      id: "dev-login",
      name: "Dev Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "dev@example.com" },
        name: { label: "Name", type: "text", placeholder: "Dev User" },
      },
      async authorize(credentials) {
        if (!DEV_MODE) return null;
        const email = credentials?.email || "dev@cipherview.local";
        const name = credentials?.name || "Dev User";
        return {
          id: devAddressFromEmail(email),
          email,
          name,
          address: devAddressFromEmail(email),
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        const email = user.email || "";
        const address =
          (user as { address?: string }).address || devAddressFromEmail(email);
        token.address = address;
        token.provider = account?.provider || "dev";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { address?: string; provider?: string }).address =
          token.address as string;
        (session.user as { address?: string; provider?: string }).provider =
          token.provider as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production",
};
