// This simulates an "internal-only" service (think: cloud metadata
// endpoint, internal admin API, etc.) that should NEVER be reachable from
// outside, and should especially never be reachable by pasting a URL into
// an unrelated public feature. It's deliberately not linked from the UI.
export default function handler(req, res) {
  res.status(200).json({
    classified: true,
    message: "This is an internal service. If you can read this via the avatar-fetch feature, that's SSRF.",
    flag: "FLAG{ssrf-reached-internal-service}"
  });
}
