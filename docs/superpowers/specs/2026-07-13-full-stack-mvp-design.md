# Lomi Market Full-Stack MVP Design

## Scope

Lomi Market is a single-store grocery delivery system for Ramallah. It consists of the existing Expo customer app, a FastAPI modular monolith, a PostgreSQL database, and a responsive React/Vite admin dashboard. Cash on delivery is the enabled payment method. SMS, push, object storage, online payments, and live driver GPS use provider interfaces with development fallbacks.

## Architecture

- `backend/`: FastAPI, Pydantic, SQLAlchemy 2, Alembic, PostgreSQL in production and SQLite for isolated tests.
- `admin/`: React, TypeScript, Vite, React Router, TanStack Query, React Hook Form and Zod.
- repository root: existing Expo SDK 55 application, enhanced with TanStack Query, SecureStore, localization, and a structured API client.
- `deployment/`: Docker Compose, Nginx, persistent PostgreSQL and upload volumes.

The API is rooted at `/api/v1`. Customer and administrator authorization use short-lived JWT access tokens and rotated, server-stored refresh tokens. Customer OTP codes are hashed, single-use, expiring and rate-limited; only the development provider returns a code in non-production mode. Administrative passwords use Argon2-compatible password hashing through `pwdlib`.

## Domain and Data Flow

Users share one identity table and receive roles. Customer profiles, preferences, addresses, carts, device tokens and orders reference users. Categories and products store English and Arabic fields directly because the MVP supports exactly two languages. Inventory is product-level. Order items snapshot names, unit, image and price. Checkout recalculates totals, locks inventory rows, validates delivery zones and promotions, and uses an idempotency key.

Mobile and admin clients never calculate authoritative totals or infer permissions. They call the same API through typed/structured clients. TanStack Query owns server state; auth providers own session restoration and token refresh. UI-specific state remains local.

## Error Handling and Security

The API returns a consistent `{detail, code, field_errors}` error shape and request IDs. Pydantic validates input. ORM queries are scoped to the authenticated owner or guarded by admin permissions. CORS is allow-list based. Rate limits protect OTP and login routes. Uploads validate extension-independent signatures, MIME type, byte size, dimensions and safe generated names. Logs exclude tokens, OTPs and passwords.

## Testing

Backend integration tests cover auth, permissions, catalog, carts, promotions, checkout, stock, orders, uploads and admin operations. Admin tests cover authentication and core CRUD interactions. Mobile unit tests cover normalization, API/session behavior and totals display contracts. Verification includes lint, type checks, tests, production web builds, Expo Doctor and an Android bundle export.

## Deployment

Docker Compose runs PostgreSQL, backend, admin static assets and Nginx with persistent database/upload volumes. TLS termination is configured at Nginx using owner-provided certificates/domain. Backups use `pg_dump`; restore uses `pg_restore`/`psql` according to dump format.
