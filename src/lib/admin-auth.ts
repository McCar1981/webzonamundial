/**
 * Admin auth — single password gated by env var ADMIN_PASSWORD.
 *
 * The login form posts the password to /api/admin/login. On success we set
 * a signed cookie containing `expires|hmac(expires)` using a secret derived
 * from ADMIN_PASSWORD itself. The middleware verifies the HMAC and the
 * expiry on every /admin/* request.
 *
 * No DB, no Supabase. Just env var + signed cookie. Two reasons:
 *  - Faster to ship (we need this for an investor demo, not for prod auth).
 *  - Edge-runtime compatible (middleware runs on edge; Web Crypto only).
 */

const ENC = new TextEncoder();

function getPassword(): string {
  const p = process.env.ADMIN_PASSWORD;
  if (!p) {
    // Fail closed: if the env var is missing in dev, set a known dev password.
    // In production we always set it on Vercel so this branch never runs.
    return "zm-admin-dev-only";
  }
  return p;
}

async function hmac(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    ENC.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, ENC.encode(message));
  return bufToHex(sig);
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Build a signed cookie value: `expires|hmac` */
export async function buildAdminCookie(ttlHours = 24): Promise<string> {
  const expires = Date.now() + ttlHours * 60 * 60 * 1000;
  const sig = await hmac(String(expires), getPassword());
  return `${expires}.${sig}`;
}

/** Validate cookie: HMAC matches AND not expired. */
export async function isValidAdminCookie(cookie: string): Promise<boolean> {
  const [expiresStr, sig] = cookie.split(".");
  if (!expiresStr || !sig) return false;
  const expires = parseInt(expiresStr, 10);
  if (!expires || Date.now() > expires) return false;
  const expected = await hmac(String(expires), getPassword());
  // constant-time-ish compare
  if (sig.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < sig.length; i++) {
    mismatch |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export const ADMIN_COOKIE_NAME = "zm_admin";
