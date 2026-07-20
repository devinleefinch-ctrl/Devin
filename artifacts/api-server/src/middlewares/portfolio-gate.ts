/**
 * Serves the portfolio static site (or proxies to the Vite dev server) only
 * to sessions that have a valid auth cookie. Unauthenticated visitors receive a
 * self-contained gate HTML page; the full portfolio bundle is never sent.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RequestHandler } from "express";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import crypto from "node:crypto";

// ─── Token verification (duplicated from portfolio-auth to avoid circular dep) ─

function getSessionSecret(): string {
  const s = process.env["SESSION_SECRET"];
  if (!s) throw new Error("SESSION_SECRET missing");
  return s;
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

function timingSafeEqStr(a: string, b: string): boolean {
  const ah = crypto.createHash("sha256").update(Buffer.from(a)).digest();
  const bh = crypto.createHash("sha256").update(Buffer.from(b)).digest();
  return crypto.timingSafeEqual(ah, bh);
}

function verifyToken(token: unknown): boolean {
  if (typeof token !== "string") return false;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return false;
  const payload = token.slice(0, idx);
  const mac = token.slice(idx + 1);
  try {
    if (!timingSafeEqStr(mac, sign(payload))) return false;
  } catch {
    return false; // SESSION_SECRET missing or other error
  }
  const exp = Number(payload);
  return Number.isFinite(exp) && Date.now() < exp;
}

// ─── Gate HTML ─────────────────────────────────────────────────────────────────

const GATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Devin Finch — Portfolio</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0d0d0d;color:#f0ede6;font-family:'Space Mono',monospace,sans-serif;
    display:flex;align-items:center;justify-content:center;min-height:100dvh}
  .wrap{width:min(360px,90vw);display:flex;flex-direction:column;gap:1.25rem}
  h1{font-size:1rem;font-weight:400;letter-spacing:.08em;text-transform:uppercase;
    color:#888;margin-bottom:.25rem}
  p{font-size:.85rem;color:#555;letter-spacing:.03em}
  input{width:100%;padding:.7rem .9rem;background:#1a1a1a;border:1px solid #333;
    color:#f0ede6;font-family:inherit;font-size:.95rem;border-radius:3px;outline:none}
  input:focus{border-color:#666}
  button{padding:.7rem 1.2rem;background:#f0ede6;color:#0d0d0d;border:none;
    font-family:inherit;font-size:.9rem;font-weight:700;letter-spacing:.06em;
    cursor:pointer;border-radius:3px;text-transform:uppercase}
  button:hover{background:#fff}
  .err{font-size:.8rem;color:#c44;letter-spacing:.03em;min-height:1.1rem}
  .row{display:flex;gap:.75rem}
  .row input{flex:1}
</style>
</head>
<body>
<div class="wrap">
  <div>
    <h1>Devin Finch</h1>
    <p>Portfolio access required</p>
  </div>
  <div>
    <div class="row">
      <input id="pw" type="password" placeholder="Password" autocomplete="off" spellcheck="false" aria-label="Password">
      <button id="btn" type="button">Enter →</button>
    </div>
    <div class="err" id="err" aria-live="polite"></div>
  </div>
</div>
<script>
const pw=document.getElementById('pw');
const btn=document.getElementById('btn');
const err=document.getElementById('err');
async function attempt(){
  const v=pw.value.trim();
  if(!v)return;
  btn.disabled=true;
  try{
    const r=await fetch('/api/portfolio/unlock',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body:JSON.stringify({password:v})
    });
    if(r.ok){location.reload();return;}
    if(r.status===429){err.textContent='Too many attempts — try again shortly.';}
    else{err.textContent='Incorrect password.';}
    pw.value='';pw.focus();
  }catch{err.textContent='Network error. Try again.';}
  btn.disabled=false;
}
btn.addEventListener('click',attempt);
pw.addEventListener('keydown',e=>{if(e.key==='Enter')attempt();});
pw.focus();
</script>
</body>
</html>`;

// ─── Middleware factory ─────────────────────────────────────────────────────────

const COOKIE_NAME = "df_session";
const isDev = process.env["NODE_ENV"] !== "production";

const vitePort = process.env["PORTFOLIO_VITE_PORT"] ?? "21113";

// Static file handler (production only) — built by the portfolio package.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Bundled output: artifacts/api-server/dist/index.mjs
// Go up: dist/ → api-server/ → artifacts/ → then into portfolio/dist/public
const portfolioPublicDir = path.resolve(
  __dirname,
  "..",  // api-server/
  "..",  // artifacts/
  "portfolio",
  "dist",
  "public",
);
// Validate the resolved path at startup in production so misconfigurations are
// caught immediately rather than silently serving 404s to authenticated users.
if (!isDev) {
  import("node:fs").then(({ existsSync }) => {
    if (!existsSync(portfolioPublicDir)) {
      console.error(
        `[portfolio-gate] WARNING: portfolioPublicDir does not exist: ${portfolioPublicDir}. ` +
        `Authenticated users will receive 404s. Ensure the portfolio build runs before the API server.`,
      );
    } else {
      console.info(`[portfolio-gate] Serving portfolio static files from: ${portfolioPublicDir}`);
    }
  });
}

const staticHandler: RequestHandler = express.static(portfolioPublicDir, {
  index: "index.html",
  fallthrough: true,
});

// Vite dev-server proxy (development only).
const viteProxy = isDev
  ? createProxyMiddleware({
      target: `http://localhost:${vitePort}`,
      changeOrigin: true,
      ws: true,
      // Suppress noisy proxy errors when the Vite server is restarting.
      on: {
        error(err, _req, res) {
          if (res && "writeHead" in res) {
            (res as import("http").ServerResponse).writeHead(502);
            res.end("Portfolio dev server unavailable");
          }
        },
      },
    })
  : null;

function gateResponse(res: import("express").Response) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(401).end(GATE_HTML);
}

export function portfolioGateMiddleware(): RequestHandler[] {
  const handlers: RequestHandler[] = [];

  // Auth check — must pass before any content is served.
  handlers.push((req, res, next) => {
    // Skip auth for API routes — they have their own auth.
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }
    const token = (req.cookies as Record<string, unknown> | undefined)?.[
      COOKIE_NAME
    ];
    if (!verifyToken(token)) {
      gateResponse(res);
      return;
    }
    next();
  });

  if (isDev && viteProxy) {
    handlers.push(viteProxy as RequestHandler);
  } else {
    // Serve the built portfolio static files.
    handlers.push(staticHandler);
    // SPA fallback: any unmatched non-API path serves index.html.
    handlers.push((_req, res, next) => {
      if (res.headersSent) { next(); return; }
      const indexPath = path.join(portfolioPublicDir, "index.html");
      res.setHeader("Cache-Control", "no-store");
      res.sendFile(indexPath, (err) => {
        if (err) next(err);
      });
    });
  }

  return handlers;
}
