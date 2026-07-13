# Backup and restore

Run `scripts/backup-postgres.sh` from the repository root on the deployment host. It creates compressed custom-format dumps and removes dumps older than fourteen days by default. Copy backups to encrypted off-host storage.

Restore into an empty database:

```sh
docker compose -f deployment/docker-compose.yml stop backend
docker compose -f deployment/docker-compose.yml exec -T database createdb -U lomi lomi_restore
cat backups/lomi-TIMESTAMP.dump | docker compose -f deployment/docker-compose.yml exec -T database pg_restore -U lomi -d lomi_restore --clean --if-exists
```

Validate row counts and application readiness before switching the backend database name. Upload media must be restored from the matching upload-volume backup. Test restore procedures on staging regularly.

