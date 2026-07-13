param([switch]$Force)
$ErrorActionPreference = 'Stop'
$backend = Resolve-Path (Join-Path $PSScriptRoot '..\backend')
$database = Join-Path $backend 'lomi.db'
if (-not $Force) { throw 'Reset deletes the local development database. Re-run with -Force.' }
if (Test-Path -LiteralPath $database) { Remove-Item -LiteralPath $database -Force }
Push-Location $backend
try {
  & .\.venv\Scripts\python -m alembic upgrade head
  & .\.venv\Scripts\python -m app.seed
} finally { Pop-Location }
