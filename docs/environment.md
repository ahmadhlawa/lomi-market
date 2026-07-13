# Environment variables

## Backend (`LOMI_` prefix)

| Variable | Purpose |
|---|---|
| `LOMI_ENV` | `development`, `test`, `staging`, or `production`. |
| `LOMI_DATABASE_URL` | SQLAlchemy URL; production uses `postgresql+psycopg://user:password@host:5432/database`. |
| `LOMI_SECRET_KEY` | Random secret, minimum 32 characters, used for JWT and keyed hashes. |
| `LOMI_ACCESS_TOKEN_MINUTES` | Access-token lifetime; default 15. |
| `LOMI_REFRESH_TOKEN_DAYS` | Refresh-token lifetime; default 30. |
| `LOMI_OTP_TTL_SECONDS` | OTP validity; default 300. |
| `LOMI_OTP_PROVIDER` | `development` until an SMS adapter is added/configured. |
| `LOMI_DEV_OTP` | Six-digit local OTP. Never use a shared production value. |
| `LOMI_CORS_ORIGINS` | Comma-separated exact admin/web origins. |
| `LOMI_PUBLIC_BASE_URL` | Public API origin used for upload URLs. |
| `LOMI_UPLOAD_DIR` | Persistent media directory. |
| `LOMI_MAX_UPLOAD_BYTES` | Maximum source image size; default 5 MiB. |
| `LOMI_ADMIN_EMAIL` / `LOMI_ADMIN_PASSWORD` | Initial administrator seed credentials. |

Mobile uses `EXPO_PUBLIC_API_URL`. Admin uses `VITE_API_URL` at build time. No real secret belongs in either client variable namespace.

