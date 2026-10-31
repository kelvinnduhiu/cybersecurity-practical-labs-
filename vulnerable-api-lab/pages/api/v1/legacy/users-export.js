// API9:2023 Improper Inventory Management
// Bug on purpose: this is a "v1" endpoint that predates the current API
// and was supposedly retired — but nobody actually removed it, and it
// isn't listed in /api/docs. It has no auth at all and dumps everything,
// including plaintext passwords. Students should find it the way an
// attacker would: by recon (crawling JS bundles, guessing versioned
// paths, running a content-discovery tool) rather than by being told the
// URL from the dashboard.
import { users } from "../../../../lib/db";

export default function handler(req, res) {
  res.status(200).json({
    warning: "Deprecated internal export - TODO remove before GA (this TODO is 2 years old)",
    users, // full records, plaintext passwords included
    flag: "FLAG{shadow-api-improper-inventory-management}"
  });
}
