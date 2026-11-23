// src/lib/api.js
// Server-side only — used in page.js server components
// Creates a signed HS256 JWT from the NextAuth session and sends it to FastAPI

import { auth } from "@/auth";
import { SignJWT } from "jose";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Mint a fresh HS256 JWT from the current NextAuth session.
 * FastAPI decodes this with the same AUTH_SECRET using python-jose.
 * NextAuth's own cookie is a JWE (encrypted) — NOT decodable by FastAPI directly.
 */
async function getAuthToken() {
  const session = await auth();
  if (!session?.user) {
    console.warn("[api] No session found — request will be unauthenticated");
    return null;
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

  console.log("[api] Token minted for:", session.user.email, "| sub:", session.googleId || session.user.email);
  return token;
}

async function apiFetch(path, options = {}) {
  const token = await getAuthToken();

  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    // Don't cache API responses — always fresh
    cache: "no-store",
  });

  if (!res.ok) {
    // Read raw text first so we can log it even if it's not JSON
    const rawText = await res.text().catch(() => "");
    let detail = `API ${res.status}`;
    try {
      const errJson = JSON.parse(rawText);
      const raw = errJson.detail || errJson.message || detail;
      // FastAPI 422 returns detail as an array of validation errors
      detail = Array.isArray(raw) ? JSON.stringify(raw) : raw;
    } catch {
      detail = rawText.slice(0, 200) || detail;
    }
    console.error(`[api] ${options.method || "GET"} ${path} → ${res.status}:`, detail);
    throw new Error(detail);
  }

  return res.json();
}

export const api = {
  get:    (path)        => apiFetch(path),
  post:   (path, body)  => apiFetch(path, { method: "POST",   body: JSON.stringify(body) }),
  put:    (path, body)  => apiFetch(path, { method: "PUT",    body: JSON.stringify(body) }),
  delete: (path)        => apiFetch(path, { method: "DELETE" }),
};
