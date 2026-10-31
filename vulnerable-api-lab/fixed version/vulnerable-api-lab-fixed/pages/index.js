const CHECKS = [
  { id: "API1", title: "Broken Object Level Authorization", endpoint: "GET /api/users/{id}", expect: "403 when requesting another user's id; your own id still works." },
  { id: "API2", title: "Broken Authentication", endpoint: "POST /api/auth/login, /api/auth/reset", expect: "Tokens are HMAC-signed and expire; forged/tampered tokens are rejected (401). Generic error on bad login. 429 after 5 failed attempts. Reset tokens are random, single-use, and expire in 15 minutes." },
  { id: "API3", title: "Broken Object Property Level Authorization", endpoint: "PUT /api/profile/update", expect: "Only 'email' is writable; isAdmin/role/isPremium/balance are silently ignored (returned in ignoredFields)." },
  { id: "API4", title: "Unrestricted Resource Consumption", endpoint: "POST/GET /api/orders/bulk", expect: "count above 20 is rejected with 400; GET is capped at 100 results and scoped to your own orders." },
  { id: "API5", title: "Broken Function Level Authorization", endpoint: "GET/DELETE /api/admin/users", expect: "A forged X-Role header does nothing now; only a verified admin session (role re-checked server-side) is accepted." },
  { id: "API6", title: "Unrestricted Access to Sensitive Business Flows", endpoint: "POST /api/checkout/process", expect: "The same user redeeming STUDENT50 twice is rejected on the 2nd attempt, even with pool capacity left." },
  { id: "API7", title: "Server Side Request Forgery", endpoint: "GET /api/fetch-avatar?target=...", expect: "Only the allowlisted /api/public/avatar-placeholder is reachable; /api/internal/secret and anything else returns 400." },
  { id: "API8", title: "Security Misconfiguration", endpoint: "GET /api/debug/info", expect: "401/403 without a verified admin session; no stack trace is ever returned, even with ?crash=1." },
  { id: "API9", title: "Improper Inventory Management", endpoint: "/api/v1/legacy/users-export", expect: "404 — the route has been removed from the codebase entirely, not just undocumented." },
  { id: "API10", title: "Unsafe Consumption of APIs", endpoint: "POST /api/partner/webhook", expect: "401 without a valid X-Partner-Signature (see scripts/sign-webhook.js); out-of-range refundAmount is rejected with 400." }
];

export default function Home() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 20px" }}>
      <h1>✅ Vulnerable API Lab — FIXED branch</h1>
      <p>
        This is the patched counterpart to the vulnerable lab, with one remediation per
        OWASP API Security Top 10 (2023) finding. Use it to confirm each fix actually
        closes the gap your exploit used against the vulnerable branch.
      </p>
      <div className="card">
        <strong>Test accounts</strong>
        <pre>{`alice / alice123\nbob   / bobrocks`}</pre>
        <p>Tokens now expire after 1 hour and are HMAC-signed — set <code>TOKEN_SECRET</code> and <code>WEBHOOK_SECRET</code> as real secrets in production.</p>
      </div>
      {CHECKS.map((c) => (
        <div className="card" key={c.id}>
          <span className="badge">{c.id}</span>
          <strong>{c.title}</strong>
          <p><code>{c.endpoint}</code></p>
          <p style={{ opacity: 0.85 }}><b>Expected secure behaviour:</b> {c.expect}</p>
        </div>
      ))}
    </div>
  );
}
