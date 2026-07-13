# Local setup

## Backend

Python 3.12 or newer is required. Copy `backend/.env.example` to `backend/.env`. The default code configuration uses SQLite when no environment file exists; PostgreSQL is recommended for shared development.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -e ".[dev]"
.\.venv\Scripts\alembic upgrade head
.\.venv\Scripts\python -m app.seed
.\.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

Reset local SQLite data with `powershell -File scripts/reset-dev-db.ps1 -Force` from the repository root.

## Admin

```powershell
cd admin
Copy-Item .env.example .env
npm ci
npm run dev
```

## Mobile

Copy root `.env.example` to `.env`. Android emulators normally require `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1`; iOS simulators and web can use `127.0.0.1`. Physical devices must use the development computer's LAN address.

```powershell
npm ci
npx expo start -c
```

The development OTP is returned only in development/test responses. Production never returns OTP values.

