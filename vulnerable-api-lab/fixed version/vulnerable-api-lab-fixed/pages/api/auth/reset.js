// pages/api/auth/reset.js — FIXED (closes VAPT-2026-002: predictable reset tokens)
//
// Reset tokens are now cryptographically random, single-use, and expire
// after 15 minutes (see lib/auth.js), instead of base64(username:id).
//
// A real deployment would email the token to the account's verified
// address and never return it in the API response. Since this lab has
// no email service, the token is returned ONLY when
// LAB_EXPOSE_RESET_TOKENS=true is explicitly set in the environment —
// off by default. Leave it off except when you intend to retest this
// flow yourself; never enable it on anything resembling production.
import { findUserByUsername } from "../../../lib/db";
import { issueResetToken, consumeResetToken } from "../../../lib/auth";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { action, username, token, newPassword } = req.body || {};
  const user = findUserByUsername(username);

  // Generic response even if the user doesn't exist, so this endpoint
  // can't be used to enumerate accounts either.
  if (action === "request") {
    if (!user) return res.status(200).json({ ok: true, message: "If that account exists, a reset link was sent." });
    const resetToken = issueResetToken(user.id);
    const expose = process.env.LAB_EXPOSE_RESET_TOKENS === "true";
    return res.status(200).json({
      ok: true,
      message: "If that account exists, a reset link was sent.",
      ...(expose ? { resetTokenForTesting: resetToken } : {})
    });
  }

  if (action === "confirm") {
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });
    const valid = consumeResetToken(token, user.id);
    if (!valid) return res.status(400).json({ error: "Invalid or expired token" });
    user.password = newPassword || user.password;
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: "action must be 'request' or 'confirm'" });
}
