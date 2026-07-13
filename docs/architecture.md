# Architecture

## System boundary

Lomi Market is a single-store modular monolith. Mobile and admin clients consume one versioned `/api/v1` API. The backend owns authentication, authorization, pricing, promotions, delivery fees, inventory and order transitions.

## Mobile

Expo/React Native retains the dark yellow/black visual system. React Navigation provides root, tab and nested stacks. TanStack Query manages API state and network reconciliation; SecureStore holds tokens on native devices and AsyncStorage is the web fallback. Context providers own authentication, language and the cart-facing compatibility interface. Core translations live in `src/i18n/` and RTL preference is persisted.

## Backend

FastAPI routers are divided into authentication, public catalog, customer commerce and administration. SQLAlchemy models use foreign keys, constraints, indexes, decimal money and timestamps. Alembic is the sole production schema mechanism. Services isolate authentication, cart totals, transactional order creation, storage, notifications and payments.

Checkout performs all calculations server-side, validates ownership and delivery zones, locks product rows, verifies stock, snapshots order-item data, deducts inventory and uses a per-user idempotency key.

## Admin

The admin SPA has protected routes, rotated sessions, route-level code splitting, responsive navigation and operational pages for dashboard statistics, catalog, orders, customers, promotions, delivery, settings, administrators and audit records.

## External boundaries

Notification and payment providers are interfaces. The development notification provider records/sends locally. Cash on delivery is the only active payment adapter. Local media storage uses generated filenames and WebP optimization; URLs can later be backed by object storage without changing catalog logic.

