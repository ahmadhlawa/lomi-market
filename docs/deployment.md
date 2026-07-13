# Deployment

Copy `deployment/.env.example` to `deployment/.env`, generate unique secrets, set the production origin, then run:

```sh
docker compose --env-file deployment/.env -f deployment/docker-compose.yml build
docker compose --env-file deployment/.env -f deployment/docker-compose.yml up -d
docker compose --env-file deployment/.env -f deployment/docker-compose.yml ps
curl http://your-host/ready
```

The stack provides PostgreSQL 16, migrations/seed, persistent uploads, an admin static server and Nginx gateway. Place TLS behind a provider load balancer or install certificates and enable the supplied Nginx TLS template before public launch. Restrict ports 5432 and 8000 to the internal Docker network; expose only 80/443.

Mobile production builds use EAS profiles from `eas.json`. Set `EXPO_PUBLIC_API_URL` in the selected EAS environment before building.

Logs use container stdout/stderr. Configure host log rotation and external monitoring for `/health` and `/ready`. Database and upload volumes must be included in server backups.

