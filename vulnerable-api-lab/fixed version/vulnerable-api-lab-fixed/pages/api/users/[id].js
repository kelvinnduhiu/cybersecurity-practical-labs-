// pages/api/users/[id].js — FIXED (closes VAPT-2026-001: BOLA)
//
// The caller may only read/update their OWN record unless their
// canonical (re-checked, not token-cached) role is admin. Also strips
// the password field from any response — a record should never echo a
// credential back to a client at all, regardless of ownership.
import { readToken } from "../../../lib/auth";
import { findUserById } from "../../../lib/db";

function publicView(user) {
  const { password, resetToken, ...safe } = user;
  return safe;
}

export default function handler(req, res) {
  const auth = readToken(req);
  if (!auth) return res.status(401).json({ error: "Missing or invalid token" });

  const target = findUserById(req.query.id);
  if (!target) return res.status(404).json({ error: "User not found" });

  const requester = findUserById(auth.userId);
  const isOwner = requester && requester.id === target.id;
  const isAdmin = requester && requester.role === "admin"; // re-checked against canonical record

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "You may only access your own account" });
  }

  if (req.method === "GET") {
    return res.status(200).json(publicView(target));
  }

  if (req.method === "PUT") {
    // Still only an allowlisted set of fields may be written — see
    // profile/update.js for the full fix (VAPT-2026-003). This route no
    // longer accepts a body at all to keep ownership and field-level
    // concerns separate and auditable.
    return res.status(405).json({ error: "Use PUT /api/profile/update to modify your own profile" });
  }

  return res.status(405).json({ error: "GET only" });
}
