import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import { serverEnv } from "@/lib/env";

/**
 * Request proxy (formerly `middleware`, the name Next 16 deprecated):
 *  1. Strict security headers (CSP, HSTS, nosniff, frame-ancestors, ...)
 *  2. Origin allow-listing for /api (CORS / CSRF defence)
 *  3. Server-side gate for /admin (the client check is only cosmetic)
 *
 * A per-request CSP nonce was evaluated and deliberately NOT used: Next 16
 * prerenders the app shell, so its inline bootstrap scripts are emitted without
 * a nonce and `'strict-dynamic'` would block every script at runtime (verified
 * by inspecting the built HTML: 14 script tags, 0 nonces). Inline scripts are
 * therefore allowed while the remaining directives stay strict, and violations
 * are reported to /api/security/csp-report for early detection of injection.
 *
 * Note: a proxy always runs on the Node.js runtime, so do NOT add `runtime` to
 * the exported `config` - Next rejects that combination at build time.
 */

const ADMIN_PATH = /^\/admin(?:\/|$)/;

/**
 * Files that must never be reachable over HTTP even if a misconfigured
 * static server or proxy would otherwise serve them from the project root.
 */
const BLOCKED_PATH =
  /^\/(?:\.env.*|\.git.*|\.github.*|\.next.*|\.open-next.*|\.wrangler.*|package\.json|package-lock\.json|wrangler\.jsonc|next\.config\.[cm]?[jt]s|open-next\.config\.ts|tsconfig\.json|docker-compose\.yml|vercel\.json|git\.txt|LESSONS\.md)$/i;

function buildCsp(isDev: boolean): string {
  const scriptSrc = isDev
    ? `'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com`
    : `'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    [
      "connect-src 'self'",
      "https://identitytoolkit.googleapis.com",
      "https://securetoken.googleapis.com",
      "https://www.googleapis.com",
      "https://*.googleapis.com",
      "https://*.firebaseio.com",
      "wss://*.firebaseio.com",
      "https://*.firebaseapp.com",
      "https://ik.imagekit.io",
      "https://api.imagekit.io",
    ].join(" "),
    "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    ...(isDev ? [] : ["upgrade-insecure-requests", "report-uri /api/security/csp-report"]),
  ].join("; ");
}

function applySecurityHeaders(response: NextResponse, isDev: boolean) {
  response.headers.set("Content-Security-Policy", buildCsp(isDev));
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  );
  if (!isDev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
}

function isSameOrigin(request: NextRequest, origin: string): boolean {
  try {
    const originUrl = new URL(origin);
    const host = request.headers.get("host");
    return Boolean(host) && originUrl.host === host;
  } catch {
    return false;
  }
}

function corsGuard(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return null; // same-origin navigation / server-to-server

  const allowed =
    isSameOrigin(request, origin) ||
    serverEnv.allowedCorsOrigins.includes(origin.toLowerCase()) ||
    serverEnv.allowedCorsOrigins.includes("*");

  if (allowed) return null;

  return NextResponse.json(
    { success: false, message: "Origin not allowed", code: "cors_rejected" },
    { status: 403 }
  );
}

export async function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";
  const { pathname } = request.nextUrl;

  // -------------------------------------------------- never serve internals
  if (BLOCKED_PATH.test(pathname)) {
    const notFoundResponse = NextResponse.json(
      { success: false, message: "Not found", code: "not_found" },
      { status: 404 }
    );
    applySecurityHeaders(notFoundResponse, isDev);
    return notFoundResponse;
  }

  // ------------------------------------------------------ force HTTPS (prod)
  if (!isDev) {
    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    if (forwardedProto === "http") {
      const secureUrl = new URL(request.url);
      secureUrl.protocol = "https:";
      const redirect = NextResponse.redirect(secureUrl, 308);
      applySecurityHeaders(redirect, isDev);
      return redirect;
    }
  }

  // ------------------------------------------------------------------ CORS
  if (pathname.startsWith("/api/")) {
    const rejection = corsGuard(request);
    if (rejection) {
      applySecurityHeaders(rejection, isDev);
      return rejection;
    }

    if (request.method === "OPTIONS") {
      const preflight = new NextResponse(null, { status: 204 });
      const origin = request.headers.get("origin");
      if (origin) {
        preflight.headers.set("Access-Control-Allow-Origin", origin);
        preflight.headers.set("Vary", "Origin");
        preflight.headers.set("Access-Control-Allow-Credentials", "true");
        preflight.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        preflight.headers.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, X-Requested-With"
        );
        preflight.headers.set("Access-Control-Max-Age", "600");
      }
      applySecurityHeaders(preflight, isDev);
      return preflight;
    }
  }

  // ------------------------------------------------------- admin route gate
  if (ADMIN_PATH.test(pathname)) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const verification = await verifySessionToken(token);
    const isPrivileged =
      verification.valid &&
      (verification.payload.role === "admin" || verification.payload.role === "superadmin");

    if (!isPrivileged) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      const redirect = NextResponse.redirect(loginUrl);
      applySecurityHeaders(redirect, isDev);
      return redirect;
    }
  }

  const response = NextResponse.next();
  applySecurityHeaders(response, isDev);
  return response;
}

export const config = {
  matcher: [
    /*
     * Run on every route except Next.js internals and static assets so that
     * HTML documents, API routes and /admin are all covered.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|woff|woff2|ttf|otf)$).*)",
  ],
};
