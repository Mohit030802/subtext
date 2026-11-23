"use client";

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * Ensures Google Identity Services (GIS) client script is loaded on page.
 */
export function loadGisScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  return new Promise((resolve) => {
    let script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
    const checkInterval = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
  });
}

function getCacheKey(scope) {
  const scopeSuffix = scope.split("/").pop() || "scope";
  return `subtext_gtoken_${scopeSuffix}`;
}

/**
 * Returns active unexpired token from sessionStorage if present.
 */
export function getCachedToken(scope) {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(getCacheKey(scope));
    if (!raw) return null;
    const { token, expires_at } = JSON.parse(raw);
    // 60-second safety buffer before expiry
    if (expires_at && expires_at > Date.now() + 60000) {
      return token;
    }
  } catch (err) {
    console.warn("Failed to read token cache", err);
  }
  return null;
}

/**
 * Caches granted token with expiry timestamp.
 */
export function saveCachedToken(scope, token, expiresInSec = 3500) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      token,
      expires_at: Date.now() + expiresInSec * 1000,
    };
    sessionStorage.setItem(getCacheKey(scope), JSON.stringify(payload));
  } catch (err) {
    console.warn("Failed to write token cache", err);
  }
}

/**
 * Request an access token for a Google scope.
 * - Reuses cached token when valid (0 popups).
 * - Passes hint: userEmail to skip Google's "Choose an account" picker.
 * - Uses prompt: "" so Google only asks for consent once; subsequent requests are silent.
 */
export async function getGoogleAccessToken(scope, userEmail) {
  const cached = getCachedToken(scope);
  if (cached) {
    return cached;
  }

  await loadGisScript();

  return new Promise((resolve, reject) => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope,
        hint: userEmail || undefined,
        callback: (response) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          const token = response.access_token;
          const expiresIn = response.expires_in ? Number(response.expires_in) : 3500;
          saveCachedToken(scope, token, expiresIn);
          resolve(token);
        },
      });

      // prompt: "" avoids re-prompting if permissions were already granted
      client.requestAccessToken({
        prompt: "",
        hint: userEmail || undefined,
      });
    } catch (err) {
      reject(err);
    }
  });
}
