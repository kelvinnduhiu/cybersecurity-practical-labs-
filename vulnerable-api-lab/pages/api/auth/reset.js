// API2:2023 Broken Authentication (password reset flow)
// Bugs on purpose:
//  - Reset "tokens" are predictable: base64(username + ":" + userId), no
//    randomness, no expiry, reusable forever.
//  - No proof of email/SMS ownership is ever checked.
// POST { action: "request", username }  -> returns the token directly
//   (a real app would email it — doing that server-side isn't practical
//   for a public lab, so we hand it back so the vulnerability is still
//   exploitable end-to-end; the bug being taught is the PREDICTABILITY,
//   not the delivery channel).
// POST { action: "confirm", username, token, newPassword }
import { findUserByUsername } from "../../../lib/db";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { action, username, token, newPassword } = req.body || {};
  const user = findUserByUsername(username);
  if (!user) return res.status(404).json({ error: "No such user" });

  const predictableToken = Buffer.from(`${user.username}:${user.id}`).toString("base64");

  if (action === "request") {
    user.resetToken = predictableToken;
    return res.status(200).json({ resetToken: predictableToken });
  }

  if (action === "confirm") {
    if (token !== predictableToken) {
      return res.status(401).json({ error: "Bad token" });
    }
    user.password = newPassword || user.password;
    return res.status(200).json({ ok: true, note: "Password changed. Token never expired or was single-use." });
  }

  return res.status(400).json({ error: "action must be 'request' or 'confirm'" });
}
