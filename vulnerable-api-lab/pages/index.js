const CHALLENGES = [
  {
    id: "API1",
    title: "Broken Object Level Authorization",
    endpoint: "GET/PUT /api/users/{id}",
    hint: "Log in as one user, then change the :id in the URL to someone else's."
  },
  {
    id: "API2",
    title: "Broken Authentication",
    endpoint: "POST /api/auth/login, POST /api/auth/reset",
    hint: "Look closely at the shape of the token you get back on login. Also check the login error messages, and whether the reset flow needs anything unpredictable."
  },
  {
    id: "API3",
    title: "Broken Object Property Level Authorization",
    endpoint: "PUT /api/profile/update",
    hint: "This one DOES check you're editing your own account. What fields does it let you send, though?"
  },
  {
    id: "API4",
    title: "Unrestricted Resource Consumption",
    endpoint: "POST/GET /api/orders/bulk",
    hint: "Is there any cap on quantities, batch sizes, or result counts?"
  },
  {
    id: "API5",
    title: "Broken Function Level Authorization",
    endpoint: "GET/DELETE /api/admin/users",
    hint: "An 'admin only' route needs to know your role from somewhere. Where's it getting it?"
  },
  {
    id: "API6",
    title: "Unrestricted Access to Sensitive Business Flows",
    endpoint: "POST /api/checkout/process",
    hint: "STUDENT50 is supposed to be a scarce 5-use coupon. Is per-user usage tracked anywhere?"
  },
  {
    id: "API7",
    title: "Server Side Request Forgery",
    endpoint: "GET /api/fetch-avatar?target=...",
    hint: "The server fetches whatever you point it at. There's a non-public internal route at /api/internal/secret that it should never be able to reach for you."
  },
  {
    id: "API8",
    title: "Security Misconfiguration",
    endpoint: "GET /api/debug/info",
    hint: "A debug endpoint that made it to prod. Try the ?crash=1 query param too."
  },
  {
    id: "API9",
    title: "Improper Inventory Management",
    endpoint: "??? (not listed in /api/docs)",
    hint: "Check /api/docs for 'the full API surface' — then think about what an old 'v1' of an API like this might still have lying around, and how you'd find it without being told."
  },
  {
    id: "API10",
    title: "Unsafe Consumption of APIs",
    endpoint: "POST /api/partner/webhook",
    hint: "This simulates an inbound webhook from a payment partner. Is the request's authenticity ever actually verified? What happens with unusual values?"
  }
];

export default function Home() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 20px" }}>
      <h1>🧪 Vulnerable API Lab — OWASP API Security Top 10</h1>
      <p>
        Every challenge below maps to one category of the{" "}
        <a href="https://owasp.org/API-Security/editions/2023/en/0x11-t10/" target="_blank" rel="noreferrer">
          OWASP API Security Top 10 (2023)
        </a>
        . Find the bug, exploit it with whatever tooling you like (Postman/Insomnia, Burp Suite, OWASP ZAP,
        curl, ffuf/dirsearch, jwt_tool, Python requests/httpx scripts, Nuclei...), and look for a{" "}
        <code>FLAG{"{...}"}</code> in the response confirming success.
      </p>

      <div className="card">
        <strong>Test accounts</strong>
        <pre>{`alice / alice123
bob   / bobrocks`}</pre>
        <p>No admin credentials are given on purpose — that's part of several challenges.</p>
        <p>
          Public docs (deliberately incomplete): <code>GET /api/docs</code>
        </p>
        <p>
          Example login:
          <pre>{`curl -X POST /api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"alice","password":"alice123"}'`}</pre>
          Then send the returned token as <code>Authorization: Bearer &lt;token&gt;</code> on other calls.
        </p>
      </div>

      {CHALLENGES.map((c) => (
        <div className="card" key={c.id}>
          <span className="badge">{c.id}</span>
          <strong>{c.title}</strong>
          <p>
            <code>{c.endpoint}</code>
          </p>
          <p style={{ opacity: 0.85 }}>{c.hint}</p>
        </div>
      ))}

      <p style={{ opacity: 0.6, fontSize: "0.85em", marginTop: 32 }}>
        This application is intentionally insecure end-to-end. Do not reuse any of its code or patterns
        in a real product.
      </p>
    </div>
  );
}
