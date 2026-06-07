# Points Redemption & Transaction Reconciliation System

A full-stack loyalty-points redemption system: a **Laravel** REST API and a **React** (Vite) frontend, orchestrated with **Docker Compose** — Laravel (php-fpm), nginx, PostgreSQL, a queue worker, a scheduler, and the React dev server.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (provides the `docker` and `docker compose` commands)
- Git

Everything else (PHP, Composer, Node, pnpm, PostgreSQL) runs inside containers — you don't need them installed locally.

## Setup

1. **Clone the repository**

```bash
   git clone <your-repo-url> points-redemption
   cd points-redemption
```

2. **Create the environment files** from the examples

```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
```

3. **Build and start all services**

```bash
   docker compose up --build -d
```

The first build takes a few minutes (compiling PHP extensions, installing dependencies). Confirm everything is up with `docker compose ps` — you should see all six services running before continuing.

4. **Generate the application key** (run inside the backend container)

```bash
   docker compose exec backend php artisan key:generate
```

5. **Run migrations and seed sample data**

```bash
   docker compose exec backend php artisan migrate --seed
```

## Verify it's running

```bash
curl http://localhost:8000/api/health
# → {"status":"ok","service":"points-redemption-api"}
```

- **API:** http://localhost:8000/api
- **Frontend:** http://localhost:5173
- **Default admin login** (from the seeder): `admin@example.com` / `password`

## Services & ports

| Service   | Description                         | Host port |
| --------- | ----------------------------------- | --------- |
| nginx     | Web server — entry point to the API | 8000      |
| backend   | Laravel API (php-fpm)               | internal  |
| db        | PostgreSQL 16                       | 5432      |
| queue     | Queue worker (background jobs)      | internal  |
| scheduler | Task scheduler (reconciliation)     | internal  |
| frontend  | React app (Vite dev server)         | 5173      |

## Useful commands

```bash
docker compose ps                  # list running services
docker compose logs <service>      # view a service's logs (e.g. nginx, backend)
docker compose down                # stop all services
docker compose down -v             # stop and wipe the database volume
```

## Troubleshooting

- **`curl` to port 8000 refuses to connect** — the `nginx` container isn't running (it owns port 8000). Check with `docker compose ps` and `docker compose logs nginx`.
- **`up` fails with `bind: address already in use` on 5173** — something on your machine is already using that port (often a local Vite server). Free it (`lsof -i :5173`, then stop that process), or bring up just the backend services: `docker compose up -d db backend nginx queue scheduler`.
- **Database connection errors** — make sure `DB_HOST=db` in `backend/.env` (it must be the Compose service name, not `localhost`), then run `docker compose exec backend php artisan config:clear`.
