// A deliberately safe, public, non-sensitive route — the only
// destination the fixed fetch-avatar handler is allowed to reach.
export default function handler(req, res) {
  res.status(200).json({ placeholderAvatar: true });
}
