import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { query } from "@/lib/db";

const providers: any[] = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  }),
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  trustHost: true,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        
        if (account?.provider === "google" && user.email) {
          try {
            const res = await query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [user.email]);
            if (res[0]) {
              token.id = String(res[0].id);
            }
          } catch (e) {
            console.error("JWT google id fetch error:", e);
          }
        }
        
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Auto-upsert Google users into our DB
      if (account?.provider === "google" && user.email) {
        try {
          await query(
            `INSERT INTO users (name, email, image, "emailVerified")
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, image = EXCLUDED.image`,
            [user.name, user.email, user.image]
          );
        } catch (err) {
          console.error("DB upsert failed:", err);
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "development-secret-key-optimus-news-intelligence-32-chars",
});
