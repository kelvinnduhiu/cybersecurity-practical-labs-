// pages/api/admin/users.js — FIXED (closes VAPT-2026-005: broken function-level authz)
//
// Role is derived from a verified, signed token AND re-checked against
// the canonical user record (see lib/auth.js requireRole) — a
// client-supplied header is never consulted for authorization.
import { users } from "../../../lib/db";
import { requireRole } from "../../../lib/auth";
import { findUserById } from "../../../lib/db";

export default function handler(req, res) {
  const check = requireRole(req, "admin", findUserById);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  if (req.method === "GET") {
    const safeUsers = users.map(({ password, resetToken, ...safe }) => safe);
    return res.status(200).json({ users: safeUsers });
  }

  if (req.method === "DELETE") {
    const { id } = req.body || {};
    const idx = users.findIndex((u) => u.id === Number(id));
    if (idx === -1) return res.status(404).json({ error: "No such user" });
    const [removed] = users.splice(idx, 1);
    const { password, resetToken, ...safe } = removed;
    return res.status(200).json({ removed: safe });
  }

  return res.status(405).json({ error: "GET or DELETE only" });
}
