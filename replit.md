# Devin Finch Portfolio (devin-finch.com)

Password-gated single-page portfolio site for Devin Finch, creative director — ported faithfully from a user-supplied finished HTML design.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/portfolio/` — the site (react-vite, served at `/`). Page markup: `src/Portfolio.tsx`; all styling: `src/portfolio.css` (verbatim from the user's original design, incl. embedded F37 Judge woff2). Scaffold's `index.css`/shadcn components are unused.
- `artifacts/portfolio/public/assets/` — media drop folder. Filenames must match FILELIST exactly (case-sensitive, e.g. `polymarket-hero.jpg`, `MAMA_MVP_01 (1).mp4`). Missing files degrade gracefully (onError removes the slot).
- `attached_assets/portfolio_extract/` — original uploaded HTML source of truth.

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
