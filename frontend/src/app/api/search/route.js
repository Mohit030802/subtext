import { auth } from "@/auth";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  // Mint a fresh HS256 token (same approach as api.js)
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
  const token = await new SignJWT({
    sub: session.googleId || session.user.email,
    email: session.user.email,
    name: session.user.name,
    picture: session.user.image,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);

  const res = await fetch(
    `${BASE_URL}/api/v1/search?q=${encodeURIComponent(q)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Search failed" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
