# Database schema

Main entities:

- Identity: `users`, `customer_profiles`, `customer_preferences`, `otp_requests`, `auth_attempts`, `refresh_tokens`, `device_tokens`.
- Catalog: `categories`, `products`, `product_images`.
- Commerce: `carts`, `cart_items`, `promotions`, `addresses`, `delivery_zones`, `delivery_slots`.
- Ordering: `orders`, `order_items`, `order_status_history`, `payment_records`, `drivers`.
- Operations: `notification_records`, `audit_logs`, `application_settings`.

Identifiers are opaque UUID strings. Money uses `NUMERIC(12,2)` and ISO `ILS`. Products use optimistic version fields and nonnegative stock constraints. Order numbers and per-user idempotency keys are unique. Order items snapshot SKU, bilingual names, unit, image, unit price, quantity and line total so historical receipts do not change when the catalog changes.

Run migrations with `alembic upgrade head`; inspect history with `alembic history`. Production startup applies migrations before seeding an empty database.

