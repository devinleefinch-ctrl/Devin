# Threat Model

## Project Overview

Password-gated single-page portfolio site for Devin Finch (devin-finch.com). The stack is:
- **Frontend**: React + Vite, served as a static SPA
- **Backend**: Express 5 + Node.js 24 (TypeScript), exposed at `/api`
- **Database**: PostgreSQL via Drizzle ORM (currently no application tables beyond the scaffold)
- **Deployment**: Replit autoscale, publicly reachable at `https://devin-finch.com` and `https://portfolio-genesis.replit.app`

Users are anyone who visits the URL. A password gate on the frontend is intended to restrict access to portfolio content to invited viewers.

## Assets

- **Portfolio content** — images, videos, and text making up the creative director's portfolio. The owner wants this visible only to people who know the password.
- **Application secrets** — `DATABASE_URL` environment variable. No other secrets observed at this time.
- **API server** — publicly reachable Express instance; must not expose sensitive data or be abused by third-party sites.

## Trust Boundaries

- **Browser ↔ API server** — All requests cross this boundary. The API must not rely on client-enforced controls (e.g., the frontend password gate provides zero server-side protection).
- **API server ↔ PostgreSQL** — Application code has full database access. Parameterized queries (Drizzle ORM) must be used for all queries.
- **Public ↔ "password-gated" content** — The intended boundary between anonymous visitors and authorized viewers. Currently enforced client-side only, making it ineffective.

## Scan Anchors

- **Production entry points**: `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/index.ts`
- **Highest-risk area**: `artifacts/portfolio/src/Portfolio.tsx` — contains the entire password gate logic
- **Public surface**: All `/api/*` routes (currently only `/api/healthz`); entire portfolio SPA served publicly
- **Dev-only**: `artifacts/mockup-sandbox/` — Replit Canvas design artifact, not reachable in production

## Threat Categories

### Spoofing / Authentication

The portfolio password gate is implemented entirely in the browser as a SHA-256 hash comparison. The hash is embedded in the public JavaScript bundle and can be cracked offline. The `sessionStorage` flag (`dfok`) used to persist the unlocked state can be set manually via DevTools. There is no server-side authentication or session management.

**Required guarantee**: If content restriction is a real security requirement, the gate must be enforced server-side (e.g., a signed cookie set only after server-verified password check, protecting actual content delivery routes).

### Information Disclosure

API error handling (Express 5 default) should not expose stack traces in production. The pino logger is configured to redact `authorization` and `cookie` headers, which is appropriate. No PII is currently stored or returned.

**Required guarantee**: `NODE_ENV=production` must be set in the deployed environment so Express suppresses verbose error detail.

### Tampering

No user-writable endpoints exist today. Drizzle ORM is used for database access, which uses parameterized queries by default.

### Elevation of Privilege

No role-based access control exists yet. When admin or user-specific routes are added, authorization must be enforced server-side.

### Denial of Service

No rate limiting is applied to any API endpoint. Currently the only endpoint is `/api/healthz`, so the risk is low. Rate limiting should be added before any resource-intensive or unauthenticated data endpoints are introduced.

### Security Misconfiguration

The API server uses `cors()` with no options, which sets `Access-Control-Allow-Origin: *`. This is a latent risk as the API surface grows.
