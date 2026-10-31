// Deliberately incomplete inventory — this is what students see as "the
// whole API surface" from the docs, versus what's actually deployed.
// The gap between this list and pages/api/** is the API9 finding.
export default function handler(req, res) {
  res.status(200).json({
    version: "v2",
    endpoints: [
      "POST /api/auth/login",
      "POST /api/auth/reset",
      "GET/PUT /api/users/{id}",
      "PUT /api/profile/update",
      "GET/POST /api/orders/bulk",
      "GET/DELETE /api/admin/users",
      "POST /api/checkout/process",
      "GET /api/fetch-avatar?target=...",
      "GET /api/debug/info"
      // (that's the complete documented list — or is it?)
    ]
  });
}
