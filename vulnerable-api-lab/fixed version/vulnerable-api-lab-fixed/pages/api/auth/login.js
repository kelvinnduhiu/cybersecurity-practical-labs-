// pages/api/auth/login.js — FIXED (closes VAPT-2026-002: Broken Authentication)
//
// - Signed, expiring tokens (see lib/auth.js) instead of unsigned base64(JSON).
// - A single generic error for both "no such user" and "wrong password" —
//   no more username enumeration via distinct messages.
// - Rate limiting / lockout after repeated failed attempts on an account.
import { findUserByUsername } from "../../../lib/db";
import { issueToken, checkLoginRateLimit, recordLoginFailure, recordLoginSuccess } from "../../../lib/auth";

const GENERIC_ERROR = "Invalid username or password";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: GENERIC_ERROR });

  const limit = checkLoginRateLimit(username);
  if (!limit.allowed) {
    return res.status(429).json({
      error: `Too many failed attempts. Try again in ${limit.retryAfterSec}s.`
    });
  }

  const user = findUserByUsername(username);
  // Same generic error whether the username doesn't exist or the
  // password is wrong — and we still record a "failure" either way so
  // enumeration-by-timing/lockout-behaviour is also not informative.
  if (!user || user.password !== password) {
    recordLoginFailure(username);
    return res.status(401).json({ error: GENERIC_ERROR });
  }

  recordLoginSuccess(username);
  const token = issueToken(user);
  res.status(200).json({ token });
}
