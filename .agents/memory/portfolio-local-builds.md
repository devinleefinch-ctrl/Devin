---
name: Portfolio local production builds
description: Local `vite build` for the portfolio needs env vars that the platform normally injects
---

# Local production builds need PORT + BASE_PATH

**Rule:** A bare `pnpm --filter @workspace/portfolio run build` fails at vite config load ("PORT environment variable is required"). Prefix with the values from `artifacts/portfolio/.replit-artifact/artifact.toml` `[services.env]`: `PORT=21113 BASE_PATH=/ pnpm --filter @workspace/portfolio run build`.
**Why:** The security rework made vite.config.ts throw on missing PORT/BASE_PATH. The platform injects `services.env` for dev and publish-time builds, so deploys are unaffected — only manual shell builds hit this.
**How to apply:** When verifying a production build locally or refreshing `dist/public` (which the api-server serves to authenticated visitors in prod), always pass both vars. `emptyOutDir: true` means each build also clears stale files from dist.
