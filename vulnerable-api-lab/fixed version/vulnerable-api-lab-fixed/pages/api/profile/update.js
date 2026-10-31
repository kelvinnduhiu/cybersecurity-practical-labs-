// pages/api/profile/update.js — FIXED (closes VAPT-2026-003: mass assignment)
//
// Only an explicit allowlist of fields may be written by the client.
// Privileged fields (role, isAdmin, isPremium, balance) are server-
// managed and simply ignored if present in the request body.
import { readToken } from "../../../lib/auth";
import { findUserById } from "../../../lib/db";

const WRITABLE_FIELDS = ["email"]; // add more here deliberately, one at a time, as the product needs them

export default function handler(req, res) {
  if (req.method !== "PUT") return res.status(405).json({ error: "PUT only" });
  const auth = readToken(req);
  if (!auth) return res.status(401).json({ error: "Missing or invalid token" });

  const user = findUserById(auth.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const body = req.body || {};
  const ignored = Object.keys(body).filter((k) => !WRITABLE_FIELDS.includes(k));
  for (const field of WRITABLE_FIELDS) {
    if (field in body) user[field] = body[field];
  }

  const { password, resetToken, ...safe } = user;
  res.status(200).json({
    updated: safe,
    ...(ignored.length ? { ignoredFields: ignored } : {})
  });
}
