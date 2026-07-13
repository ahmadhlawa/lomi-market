# Lomi Market

Lomi Market is a production-oriented, single-store grocery delivery MVP for Ramallah, Palestine. The repository contains an Expo customer application, FastAPI API, PostgreSQL schema, responsive React admin dashboard, automated tests, and Docker Compose deployment foundation.

## Applications

- Root: Expo SDK 55 customer app for Android, iOS, and web.
- `backend/`: FastAPI modular monolith, SQLAlchemy, Alembic, PostgreSQL.
- `admin/`: React 19, TypeScript, Vite, React Router, TanStack Query.
- `deployment/`: PostgreSQL, backend, admin and Nginx Compose stack.

## Quick start

Prerequisites: Node.js 22+, Python 3.12+, and PostgreSQL 16+ or Docker.

```powershell
# Backend (zero-setup SQLite development mode)
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -e ".[dev]"
.\.venv\Scripts\alembic upgrade head
.\.venv\Scripts\python -m app.seed
.\.venv\Scripts\uvicorn app.main:app --reload

# Admin, separate terminal
cd admin
npm ci
npm run dev

# Mobile, separate terminal from repository root
npm ci
Copy-Item .env.example .env
npx expo start -c
```

Development administrator: `admin@lomi.ps` / `ChangeMe123!`. Development customer OTP: `123456`. Change administrator credentials outside local development.

API documentation is available at `http://localhost:8000/docs` outside production. Admin runs at `http://localhost:5173`.

## Verification

```powershell
cd backend; .\.venv\Scripts\ruff check app tests; .\.venv\Scripts\pytest --cov=app
cd ..\admin; npm test; npm run lint; npm run typecheck; npm run build; npm audit
cd ..; npm test; npx expo-doctor; npx expo export --platform android; npx expo export --platform web
```

See [local setup](docs/local-setup.md), [architecture](docs/architecture.md), [API](docs/api.md), and [deployment](docs/deployment.md).
