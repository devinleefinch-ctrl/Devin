# Memory index

- [Portfolio gate verification](portfolio-gate-verification.md) — auth is server-side; screenshots need temp dev bypass (always revert + re-curl 401); gate copy lives in TWO places that must stay synced.
- [Portfolio local builds](portfolio-local-builds.md) — manual `vite build` needs `PORT=21113 BASE_PATH=/` (platform injects these at deploy; only shell builds fail without them).
