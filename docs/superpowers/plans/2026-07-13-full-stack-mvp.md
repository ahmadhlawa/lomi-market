# Lomi Market Full-Stack MVP Implementation Plan

> **For agentic workers:** Execute inline with test-driven development and verification checkpoints.

**Goal:** Deliver a locally reproducible, production-oriented single-store grocery delivery MVP across mobile, API, database, admin, testing, documentation and deployment.

**Architecture:** FastAPI modular monolith with SQLAlchemy/Alembic/PostgreSQL, a React/Vite admin SPA, and the existing Expo app connected through `/api/v1`. External providers are isolated behind interfaces and have development fallbacks.

**Tech Stack:** Expo SDK 55, React Native 0.83, FastAPI, Pydantic 2, SQLAlchemy 2, Alembic, PostgreSQL 16, React 19, Vite, TypeScript, TanStack Query 5, Docker Compose, Nginx.

## Global Constraints

- Single grocery store, Ramallah, ILS, Arabic and English.
- Cash on delivery enabled; online payment disabled behind an adapter.
- PostgreSQL production database; SQLite may be used only for tests and zero-setup development fallback.
- No real secrets or provider credentials in Git.
- Server is authoritative for inventory, promotions, fees and totals.
- Order items preserve purchase-time snapshots.

### Task 1: Backend foundation and domain

- [ ] Write failing configuration, model and health tests.
- [ ] Add Python packaging, settings, async database lifecycle, models and Alembic migration.
- [ ] Add deterministic seed/reset commands and environment examples.
- [ ] Run focused tests and migration verification.

### Task 2: Authentication and authorization

- [ ] Write failing OTP, refresh rotation, logout, admin login and permission tests.
- [ ] Implement token/password/OTP security, provider abstraction, rate limiting and auth dependencies.
- [ ] Run auth and security tests.

### Task 3: Customer commerce API

- [ ] Write failing catalog, address, cart, promotion, checkout, inventory and order tests.
- [ ] Implement versioned routes and transactional services.
- [ ] Run customer API integration tests.

### Task 4: Admin, media and operations API

- [ ] Write failing admin CRUD, order transition, audit and upload tests.
- [ ] Implement RBAC-protected admin routes, storage/notification/payment interfaces and dashboards.
- [ ] Run admin and media tests.

### Task 5: Admin dashboard

- [ ] Write failing auth/client/component tests.
- [ ] Implement responsive protected shell, dashboard, products, categories, orders, customers, promotions, delivery, settings, admin users and audit pages.
- [ ] Run tests, lint, typecheck and production build.

### Task 6: Customer mobile integration

- [ ] Write failing phone, session and API-client unit tests.
- [ ] Add SecureStore auth, QueryClient, API-backed catalog/cart/checkout/orders/addresses/profile and localization.
- [ ] Preserve the visual system while adding loading, retry, empty and error states.
- [ ] Run tests, Expo Doctor and Android/web exports.

### Task 7: Deployment and documentation

- [ ] Add Dockerfiles, Compose, Nginx, CI, backup/reset scripts and health checks.
- [ ] Document setup, architecture, schema, API/auth, admin use, deployment, backup, external services, limitations and changelog.
- [ ] Verify a clean-clone workflow and all commands.

### Task 8: Final verification

- [ ] Run the complete backend suite with coverage.
- [ ] Run admin tests, lint, typecheck and production build.
- [ ] Run mobile tests, dependency checks and production bundle exports.
- [ ] Check Git diff, secret patterns, generated artifacts and documentation accuracy.
