/** Serves the public portfolio or proxies to its Vite development server. */
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RequestHandler } from "express";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const isDev = process.env["NODE_ENV"] !== "production";
const vitePort = process.env["PORTFOLIO_VITE_PORT"] ?? "21113";

// Bundled output: artifacts/api-server/dist/index.mjs
// Go up: dist/ → api-server/ → artifacts/ → then into portfolio/dist/public.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const portfolioPublicDir = path.resolve(
  __dirname,
  "..",
  "..",
  "portfolio",
  "dist",
  "public",
);

if (!isDev) {
  import("node:fs").then(({ existsSync }) => {
    if (!existsSync(portfolioPublicDir)) {
      console.error(
        `[portfolio] WARNING: portfolioPublicDir does not exist: ${portfolioPublicDir}. ` +
          `Visitors will receive 404s. Ensure the portfolio build runs before the API server.`,
      );
    } else {
      console.info(
        `[portfolio] Serving portfolio static files from: ${portfolioPublicDir}`,
      );
    }
  });
}

const staticHandler: RequestHandler = express.static(portfolioPublicDir, {
  index: "index.html",
  fallthrough: true,
});

const viteProxy = isDev
  ? createProxyMiddleware({
      target: `http://localhost:${vitePort}`,
      changeOrigin: true,
      ws: true,
      on: {
        error(_err, _req, res) {
          if (res && "writeHead" in res) {
            (res as import("http").ServerResponse).writeHead(502);
            res.end("Portfolio dev server unavailable");
          }
        },
      },
    })
  : null;

export function portfolioMiddleware(): RequestHandler[] {
  if (isDev && viteProxy) {
    return [viteProxy as RequestHandler];
  }

  return [
    staticHandler,
    (_req, res, next) => {
      if (res.headersSent) {
        next();
        return;
      }
      const indexPath = path.join(portfolioPublicDir, "index.html");
      res.setHeader("Cache-Control", "no-store");
      res.sendFile(indexPath, (err) => {
        if (err) next(err);
      });
    },
  ];
}