import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === "/login";

      if (isOnLogin) {
        // Already logged in → redirect to dashboard
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      // Protected route → must be logged in
      if (!isLoggedIn) return false;
      return true;
    },
    session({ session, token }) {
      return session;
    },
  },
});
