import { auth } from "@/auth";
export default auth;

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (Next.js static assets)
     * - _next/image   (Next.js image optimization)
     * - favicon.ico
     * - /api/auth     (NextAuth endpoints — must stay public)
     * - /login        (login page — must stay public)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth|login).*)",
  ],
};
