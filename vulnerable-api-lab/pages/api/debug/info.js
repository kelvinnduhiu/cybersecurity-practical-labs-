// API8:2023 Security Misconfiguration
// Bugs on purpose:
//  - Debug endpoint left enabled in "production", no auth at all.
//  - Permissive CORS (Access-Control-Allow-Origin: *) on a sensitive route.
//  - Verbose error output / stack traces, framework + runtime fingerprint,
//    and partial environment info exposed to any caller.
export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // BUG: wide-open CORS on an info-leaking endpoint
  res.setHeader("X-Powered-By", "Next.js (debug build)"); // BUG: fingerprinting

  try {
    if (req.query.crash) {
      // Deliberately throw to show the verbose error handling bug below.
      throw new Error("Simulated unhandled exception for lab purposes");
    }
    res.status(200).json({
      debugModeEnabled: true,
      nodeVersion: process.version,
      platform: process.platform,
      envKeysPresent: Object.keys(process.env).filter((k) => k.startsWith("LAB_") || k.startsWith("NEXT_")),
      note: "A real prod deployment should never expose this route, period.",
      flag: "FLAG{security-misconfiguration-debug-endpoint}"
    });
  } catch (err) {
    // BUG: full stack trace returned to the client.
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}
