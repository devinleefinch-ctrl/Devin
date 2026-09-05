import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { portfolioMiddleware } from "./middlewares/portfolio-gate";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// Restrict CORS to this app's own domains (dev + production). The portfolio
// frontend is served from the same origin via path routing, so cross-origin
// access is not needed; browsers only send an Origin header on cross-origin
// (or CORS-mode) requests, and anything not on the allowlist is rejected.
const allowedOrigins = new Set<string>(
  [
    process.env.REPLIT_DEV_DOMAIN,
    ...(process.env.REPLIT_DOMAINS?.split(",") ?? []),
  ]
    .filter((domain): domain is string => Boolean(domain?.trim()))
    .map((domain) => `https://${domain.trim()}`),
);

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin and non-browser requests (no Origin header) are allowed.
      // Disallowed origins get no CORS headers (browser blocks the response)
      // rather than a server error.
      callback(null, !origin || allowedOrigins.has(origin));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// Public portfolio — proxy to Vite in development and serve its build in production.
app.use("/", portfolioMiddleware());

export default app;
