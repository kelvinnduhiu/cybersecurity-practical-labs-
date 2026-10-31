export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { code } = req.body || {};
  const expected = process.env.LAB_ACCESS_CODE;
  if (!expected || code !== expected) {
    return res.status(401).json({ error: "Invalid access code" });
  }
  res.setHeader(
    "Set-Cookie",
    `lab_access=${expected}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`
  );
  res.status(200).json({ ok: true });
}
