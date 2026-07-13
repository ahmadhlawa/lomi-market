# API reference

Interactive OpenAPI is generated at `/docs` outside production. All business endpoints use `/api/v1`.

## Authentication

- `POST /auth/otp/request`, `/auth/otp/verify`, `/auth/refresh`, `/auth/logout`
- `GET/PATCH /auth/me`, `POST /auth/me/delete-request`
- `POST /auth/admin/login`

## Customer

- Catalog: categories, paginated/filterable products, product details/related products, delivery slots, public settings.
- Cart: read, add/update/remove/clear items, apply/remove promotion.
- Addresses: list/create/update/delete.
- Checkout: preview and idempotent order placement.
- Orders: list/detail/cancel/reorder.
- Devices: register/deactivate push tokens.

## Administration

- Dashboard statistics and low-stock/recent-order data.
- Product/category CRUD, multiple product images, image reorder/removal and validated media upload.
- Order list/detail/status transitions.
- Customers and histories.
- Promotion CRUD.
- Delivery zones, slots and drivers.
- Settings, administrator accounts and audit logs.

Errors use `{ "detail": string, "code": string, "field_errors": object|null }`. Pagination uses `{items,total,page,page_size,pages}`. Order creation requires an `Idempotency-Key` header.

