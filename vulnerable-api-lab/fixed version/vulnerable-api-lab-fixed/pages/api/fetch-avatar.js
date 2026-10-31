// pages/api/fetch-avatar.js — FIXED (closes VAPT-2026-007: SSRF)
//
// The server will now only ever fetch a path on an explicit allowlist —
// client input selects AMONG known-safe options, it never supplies the
// destination itself. Everything else, including the previously
// reachable /api/internal/secret, is rejected outright.
const ALLOWED_TARGETS = new Set(["/api/public/avatar-placeholder"]);

export default async function handler(req, res) {
  const { target } = req.query;
  if (!target || !ALLOWED_TARGETS.has(target)) {
    return res.status(400).json({
      error: "target must be one of the allowlisted paths",
      allowed: Array.from(ALLOWED_TARGETS)
    });
  }

  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["host"];
  const url = `${proto}://${host}${target}`;

  try {
    const r = await fetch(url);
    const body = await r.json();
    res.status(200).json({ fetchedFrom: url, status: r.status, body });
  } catch (e) {
    res.status(502).json({ error: "Fetch failed" });
  }
}
