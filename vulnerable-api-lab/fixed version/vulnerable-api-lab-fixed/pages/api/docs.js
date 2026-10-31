// pages/api/docs.js — FIXED (closes VAPT-2026-009: improper inventory management)
//
// The legacy /api/v1/legacy/users-export route has been fully REMOVED
// from the codebase (not just undocumented) — requesting it now returns
// Next.js's normal 404, the same as any route that doesn't exist.
//
// This list should ideally be generated from the route tree at build
// time rather than hand-maintained, so it can never silently drift from
// what's actually deployed; doing that is a natural follow-up exercise.
export default function handler(req, res) {
  res.status(200).json({
    version: "v2",
    endpoints: [
      "POST /api/auth/login",
      "POST /api/auth/reset",
      "GET /api/users/{id}",
      "PUT /api/profile/update",
      "GET/POST /api/orders/bulk",
      "GET/DELETE /api/admin/users (admin only)",
      "POST /api/checkout/process",
      "GET /api/fetch-avatar?target=... (allowlisted targets only)",
      "GET /api/debug/info (admin only)",
      "POST /api/partner/webhook (signed requests only)"
    ]
  });
}
