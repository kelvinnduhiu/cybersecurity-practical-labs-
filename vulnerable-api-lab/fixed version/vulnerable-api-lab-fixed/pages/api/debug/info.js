// pages/api/debug/info.js — FIXED (closes VAPT-2026-008: security misconfiguration)
//
// Gated behind a verified admin session (not a diagnostics-for-anyone
// route), no wildcard CORS, and no stack trace or internal file paths
// are ever returned to the client — errors are logged server-side only
// and a generic message is returned instead.
import { requireRole } from "../../../lib/auth";
import { findUserById } from "../../../lib/db";

export default function handler(req, res) {
  const check = requireRole(req, "admin", findUserById);
  if (!check.ok) return res.status(check.status).json({ error: check.error });

  try {
    if (req.query.crash) {
      throw new Error("Simulated unhandled exception for lab purposes");
    }
    res.status(200).json({
      nodeVersion: process.version,
      note: "Diagnostics are now admin-gated and leak no stack traces."
    });
  } catch (err) {
    console.error("debug/info error:", err); // full detail logged server-side only
    res.status(500).json({ error: "Internal server error" }); // generic response to the client
  }
}
