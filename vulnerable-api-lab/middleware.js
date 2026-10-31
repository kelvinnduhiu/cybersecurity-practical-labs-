import { NextResponse } from "next/server";

// This gate exists ONLY so a publicly hosted vercel.app URL isn't a random
// open target for drive-by bots/scrapers. It is intentionally separate
// from, and does not patch, any of the OWASP API Top 10 findings the lab
// is built to teach — every /api/* vulnerability is still fully live once
// a student has the class access code.
//
// Set LAB_ACCESS_CODE in your Vercel project's Environment Variables.
// Leave it unset locally and the gate is skipped for easier dev.

export function middleware(req) {
  const code = process.env.LAB_ACCESS_CODE;
  if (!code) return NextResponse.next(); // no code configured -> gate disabled

  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname === "/welcome" ||
    pathname === "/api/gate/unlock" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const unlocked = req.cookies.get("lab_access")?.value === code;
  if (!unlocked) {
    const url = req.nextUrl.clone();
    url.pathname = "/welcome";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
