import { Router, type IRouter, type Request } from "express";
import crypto from "node:crypto";

const router: IRouter = Router();

const COOKIE_NAME = "df_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function getSessionSecret(): string {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is required.");
  }
  return secret;
}

function getPortfolioPassword(): string | undefined {
  return process.env["PORTFOLIO_PASSWORD"];
}

function sign(payload: string): string | null {
  try {
    return crypto
      .createHmac("sha256", getSessionSecret())
      .update(payload)
      .digest("base64url");
  } catch {
    return null;
  }
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  // Compare against a same-length digest to avoid leaking length info.
  const ah = crypto.createHash("sha256").update(ab).digest();
  const bh = crypto.createHash("sha256").update(bb).digest();
  return crypto.timingSafeEqual(ah, bh);
}

function issueToken(): string | null {
  const payload = String(Date.now() + SESSION_TTL_MS);
  const mac = sign(payload);
  if (!mac) return null;
  return `${payload}.${mac}`;
}

function verifyToken(token: unknown): boolean {
  if (typeof token !== "string") return false;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return false;
  const payload = token.slice(0, idx);
  const mac = token.slice(idx + 1);
  const expected = sign(payload);
  if (!expected || !timingSafeEqualStr(mac, expected)) return false;
  const exp = Number(payload);
  return Number.isFinite(exp) && Date.now() < exp;
}

// Simple in-memory rate limiter: max 5 attempts per IP per minute.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function rateLimited(req: Request): boolean {
  const ip = req.ip ?? "unknown";
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now >= entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

// Periodically prune stale entries.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of attempts) {
    if (now >= entry.resetAt) attempts.delete(ip);
  }
}, WINDOW_MS).unref();

router.post("/portfolio/unlock", (req, res) => {
  if (rateLimited(req)) {
    res.status(429).json({ ok: false, error: "Too many attempts. Try again shortly." });
    return;
  }

  const password = (req.body as { password?: unknown } | undefined)?.password;
  const expected = getPortfolioPassword();

  if (!expected) {
    req.log.error("PORTFOLIO_PASSWORD is not configured; refusing unlock.");
    res.status(503).json({ ok: false, error: "Gate not configured." });
    return;
  }

  if (typeof password !== "string" || !timingSafeEqualStr(password, expected)) {
    res.status(401).json({ ok: false });
    return;
  }

  const token = issueToken();
  if (!token) {
    req.log.error("SESSION_SECRET is not configured; cannot issue session.");
    res.status(503).json({ ok: false, error: "Server configuration error." });
    return;
  }
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
  res.json({ ok: true });
});

router.get("/portfolio/session", (req, res) => {
  const token = (req.cookies as Record<string, unknown> | undefined)?.[
    COOKIE_NAME
  ];
  res.json({ unlocked: verifyToken(token) });
});

export default router;
