// API7:2023 Server Side Request Forgery (SSRF)
// Bug on purpose: this "fetch my avatar from a URL" feature takes a
// client-supplied path and has the SERVER request it, with no allowlist
// of permitted hosts/schemes — the textbook SSRF pattern. A student who
// points it at an internal-only route (see /api/internal/secret) proves
// the server can be made to reach places the client itself cannot.
//
// Safety note for a PUBLIC deployment: to avoid this lab being abused as
// an open internet proxy once it's live on a public vercel.app URL, this
// handler only ever makes a REAL outbound request back to itself
// (same-origin) — any `target` the student sends is mapped onto a path
// of this same app, not onto an arbitrary external host. The lesson
// (server trusts client-supplied destination with no allowlist) is fully
// intact; only the blast radius is contained for responsible hosting.
export default async function handler(req, res) {
  const { target } = req.query;
  if (!target) {
    return res.status(400).json({ error: "Pass ?target=<path-or-url> to fetch" });
  }

  // BUG: no allowlist check on `target` at all before deciding what to
  // request — we just blindly take whatever path-like thing was given.
  let path = target;
  try {
    const u = new URL(target);
    path = u.pathname + u.search; // if they passed a full URL, we "helpfully" still honor the path
  } catch {
    // not a full URL — treat as a raw path, also unvalidated
  }

  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["host"];
  const internalUrl = `${proto}://${host}${path.startsWith("/") ? path : "/" + path}`;

  try {
    const r = await fetch(internalUrl);
    const body = await r.text();
    res.status(200).json({ fetchedFrom: internalUrl, status: r.status, body: safeJson(body) });
  } catch (e) {
    res.status(502).json({ error: "Fetch failed", detail: String(e), fetchedFrom: internalUrl });
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
