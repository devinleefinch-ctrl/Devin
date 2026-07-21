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
  body{background:#F7F5F0;color:#0B0B0B;font-family:ui-monospace,Menlo,Consolas,'Courier New',monospace;
    display:flex;align-items:center;justify-content:center;min-height:100dvh;padding:24px}
  .wrap{width:min(760px,94vw);text-align:center}
  .rule{display:flex;align-items:center;margin-bottom:6px}
  .rule::before,.rule::after{content:"";flex:1;height:3px;background:#0B0B0B}
  .tag{border:2.5px solid #0B0B0B;padding:3px 16px;font-weight:700;font-size:14px;letter-spacing:.18em}
  h1{font-family:Impact,'Arial Black',sans-serif;font-weight:900;font-size:clamp(64px,14vw,150px);
    line-height:.92;letter-spacing:.01em;text-transform:uppercase}
  .ask{font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:.06em;margin-top:40px;text-transform:uppercase}
  input{display:block;margin:16px auto 0;background:transparent;border:0;border-bottom:2.5px dashed #0B0B0B;
    font-family:inherit;font-size:18px;letter-spacing:.22em;text-align:center;color:#0B0B0B;
    padding:6px 4px;width:min(300px,80vw);outline:none}
  button{display:inline-block;margin-top:22px;padding:9px 34px;background:transparent;border:2.5px solid #0B0B0B;
    color:#0B0B0B;font-family:inherit;font-weight:700;font-size:13px;letter-spacing:.18em;text-transform:uppercase;cursor:pointer}
  button:hover{background:#0B0B0B;color:#F7F5F0}
  button:disabled{opacity:.5;cursor:default}
  .err{font-size:12px;color:#B3261E;letter-spacing:.06em;min-height:1.2em;margin-top:12px}
  .blurb{font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.55;color:rgba(11,11,11,.78);
    max-width:54ch;margin:30px auto 0}
  .blurb a{color:#0B0B0B}
</style>
</head>
<body>
<div class="wrap">
  <div class="rule"><span class="tag">DEVIN FINCH</span></div>
  <h1>Portfolio</h1>
  <form id="f">
    <div class="ask">Insert Password:</div>
    <input id="pw" type="password" autocomplete="off" spellcheck="false" aria-label="Password">
    <button id="btn" type="submit">Enter →</button>
    <div class="err" id="err" aria-live="polite"></div>
  </form>
  <p class="blurb">Creative direction &amp; cultural strategy for founders, families, and platforms
  that move culture. Polymarket. The Believe! Journal. MAMA Magazine. Shane Gillis. Azealia Banks.
  Writing on brand psychology at Club Cabana Panic →
  <a href="https://clubcabanapanic.substack.com" target="_blank" rel="noopener">clubcabanapanic.substack.com</a>.
  For access: <a href="mailto:devin@ohokbb.com">devin@ohokbb.com</a></p>
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
document.getElementById('f').addEventListener('submit',function(e){e.preventDefault();attempt();});
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
