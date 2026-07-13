#!/usr/bin/env sh
set -eu
: "${POSTGRES_DB:=lomi}"
: "${POSTGRES_USER:=lomi}"
: "${BACKUP_DIR:=./backups}"
mkdir -p "$BACKUP_DIR"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
docker compose -f deployment/docker-compose.yml exec -T database pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB" > "$BACKUP_DIR/lomi-$timestamp.dump"
find "$BACKUP_DIR" -type f -name 'lomi-*.dump' -mtime +14 -delete
