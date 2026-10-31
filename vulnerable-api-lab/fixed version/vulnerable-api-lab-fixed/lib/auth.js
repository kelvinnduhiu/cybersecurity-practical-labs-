// lib/auth.js
//
// Replaces the vulnerable unsigned base64(JSON) token scheme from the
// original lab (VAPT-2026-002) with an HMAC-signed, expiring token, plus
// login rate limiting and webhook signature verification (VAPT-2026-010).
//
// In a real deployment, TOKEN_SECRET and WEBHOOK_SECRET MUST be set as
// strong, random environment variables (e.g. `openssl rand -hex 32`).
// The fallback values below exist only so the lab runs out of the box;
// they are intentionally obvious so nobody mistakes them for production
// secrets.
const crypto = require("crypto");

const TOKEN_SECRET = process.env.TOKEN_SECRET || "dev-only-change-me-token-secret";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "dev-only-change-me-webhook-secret";
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sign(payloadB64) {
  return crypto.createHmac("sha256", TOKEN_SECRET).update(payloadB64).digest("base64url");
}

// --- Signed session tokens ---------------------------------------------
function issueToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + TOKEN_TTL_MS
  };
  const payloadB64 = base64url(JSON.stringify(payload));
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

// Returns the verified payload, or null if the token is missing,
// malformed, tampered with, or expired. CALLERS MUST NOT TRUST
// payload.role for authorization decisions on sensitive actions without
// re-checking the canonical user record — see requireRole() below.
function readToken(req) {
  const header = req.headers["authorization"] || "";
  const raw = header.startsWith("Bearer ") ? header.slice(7) : header;
  if (!raw) return null;

  const [payloadB64, signature] = raw.split(".");
  if (!payloadB64 || !signature) return null;

  const expected = sign(payloadB64);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null; // signature invalid or tampered — reject outright
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!payload.exp || Date.now() > payload.exp) return null; // expired
  return payload;
}

// Re-derives the caller's role from the canonical user record rather than
// trusting the (now-signed, but still cached-at-login-time) role claim
// inside the token. Closes VAPT-2026-005 at the root rather than only
// fixing the header-trust symptom.
function requireRole(req, role, findUserById) {
  const auth = readToken(req);
  if (!auth) return { ok: false, status: 401, error: "Missing or invalid token" };
  const user = findUserById(auth.userId);
  if (!user) return { ok: false, status: 401, error: "User no longer exists" };
  if (user.role !== role) return { ok: false, status: 403, error: `${role} role required` };
  return { ok: true, auth, user };
}

// --- Login rate limiting (VAPT-2026-002) --------------------------------
// In-memory, per-process — resets on cold start, which is an accepted
// limitation for a training lab (see README). A production deployment
// should back this with a shared store (Redis, etc.) behind a serverless
// deployment with multiple concurrent instances.
const failedAttempts = new Map(); // key: username -> { count, lockedUntil }
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

function checkLoginRateLimit(username) {
  const entry = failedAttempts.get(username);
  if (entry && entry.lockedUntil && Date.now() < entry.lockedUntil) {
    const retryAfterSec = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    return { allowed: false, retryAfterSec };
  }
  return { allowed: true };
}

function recordLoginFailure(username) {
  const entry = failedAttempts.get(username) || { count: 0, lockedUntil: null };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
    entry.count = 0;
  }
  failedAttempts.set(username, entry);
}

function recordLoginSuccess(username) {
  failedAttempts.delete(username);
}

// --- Password reset tokens (VAPT-2026-002) ------------------------------
// Cryptographically random, single-use, short-lived — replaces the
// predictable base64(username:id) scheme.
const resetTokens = new Map(); // token -> { userId, expires }
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

function issueResetToken(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  resetTokens.set(token, { userId, expires: Date.now() + RESET_TOKEN_TTL_MS });
  return token;
}

function consumeResetToken(token, userId) {
  const entry = resetTokens.get(token);
  if (!entry) return false;
  resetTokens.delete(token); // single-use regardless of outcome
  if (entry.userId !== userId) return false;
  if (Date.now() > entry.expires) return false;
  return true;
}

// --- Webhook signature verification (VAPT-2026-010) ---------------------
function verifyWebhookSignature(rawBodyString, signatureHeader) {
  if (!signatureHeader) return false;
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBodyString).digest("hex");
  const sigBuf = Buffer.from(signatureHeader);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

function signWebhookPayload(rawBodyString) {
  // Exposed only so students/instructors can generate a validly-signed
  // test payload from the command line when retesting — see README.
  return crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBodyString).digest("hex");
}

module.exports = {
  issueToken,
  readToken,
  requireRole,
  checkLoginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
  issueResetToken,
  consumeResetToken,
  verifyWebhookSignature,
  signWebhookPayload
};
