# Pipelines

CI for Planix runs on **GitHub Actions** — see [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml).

- **CI (GitHub Actions):** typecheck, lint, and the migration up/rollback test on
  every push/PR to `main`. Quality gate only — it does not deploy.
- **CD (Coolify):** Coolify watches the GitHub repo and deploys on push to `main`
  (builds the package Dockerfiles, runs migrations, swaps containers, SSL via
  Traefik). This wiring is deferred — development is local for now.

This folder is retained to match the project structure in CLAUDE.md; the active
pipeline definition lives under `.github/workflows/`.
