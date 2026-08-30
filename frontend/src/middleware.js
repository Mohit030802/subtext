import { auth } from "@/auth";
export default auth;

export const config = {
  matcher: [
    /*
     * Match everything except:
     * - _next/static  (Next.js assets)
     * - _next/image   (Next.js image optimisation)
     * - favicon.ico
     * - /api/auth     (NextAuth endpoints — must be public)
     * - /login        (login page — must be public)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth|login).*)",
  ],
};
