---
name: Portfolio gate verification workflow
description: How to visually verify gated portfolio content now that auth is server-side; two gate UIs must stay in sync
---

# Server-side gate — verification workflow

Since the server-side auth merge, unauthenticated requests to `/` get a standalone gate HTML page (401) from the api-server middleware; the React bundle is never served without a valid `df_session` cookie. The screenshot tool cannot hold a session cookie.

**How to screenshot gated content (dev only):**
1. Add temp bypass in the middleware auth check (`if (isDev) { next(); return; }` after the `/api` skip) in `portfolio-gate.ts`.
2. Set the React `locked` useState init to `import.meta.env.DEV ? false : true` (client shows its own gate otherwise, because the session endpoint still says locked).
3. Restart the api-server workflow, screenshot, then **revert both edits, restart again, and curl `/` to confirm 401**. Never skip the final 401 check.

**Auth flow smoke test without exposing the password:** `curl -X POST .../api/portfolio/unlock -d "{\"password\":\"$PORTFOLIO_PASSWORD\"}"` (shell env expansion; never echo the value), save cookie jar, GET `/` with jar → 200.

# Two gate UIs must stay copy-synced

**Rule:** Any gate copy/design change must be applied twice: the standalone `GATE_HTML` template literal inside `artifacts/api-server/src/middlewares/portfolio-gate.ts` (what visitors actually see) AND the React `Gate` component in `Portfolio.tsx` (brief flash + edge cases).
**Why:** After the security rework there are two independent gate implementations; updating only the React one silently changes nothing for real visitors.
**How to apply:** GATE_HTML is a JS backtick template literal — keep backticks and `${` out of the HTML. It can't use the site's embedded F37 Judge font (bundle is auth-gated), so it approximates with Impact/Georgia/monospace system stacks.
