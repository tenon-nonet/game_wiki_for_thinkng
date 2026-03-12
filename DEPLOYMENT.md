# Deployment

This project can be deployed on a low-memory VPS without building on the server.

## Overview

- GitHub Actions builds the `frontend` and `backend` Docker images on pushes to `release`.
- Images are pushed to GHCR.
- The VPS only runs `docker compose pull` and `docker compose up -d`.

## GitHub setup

1. Push the `release` branch to GitHub.
2. Open the repository Actions tab and confirm `Build and Push Images` runs.
3. If the packages are private, create a GitHub personal access token for the VPS with `read:packages`.

## Image names

The workflow publishes these images:

- `ghcr.io/<github-owner>/game-wiki-frontend:release`
- `ghcr.io/<github-owner>/game-wiki-backend:release`

It also publishes a short SHA tag for each build.

## VPS setup

1. Copy `docker-compose.prod.yml` to the VPS.
2. Copy `.env.production.example` to `.env.production` and fill in the real values.
3. Log in to GHCR on the VPS.

```bash
docker login ghcr.io
```

If the images are private, use a token that can read packages.

## Deploy

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

## Update

1. Merge or push changes to `release`.
2. Wait for the GitHub Actions workflow to finish.
3. On the VPS, run:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

## Notes

- Keep the existing `docker-compose.yml` for local builds.
- Use `docker-compose.prod.yml` on the VPS to avoid `docker build`.
- On a 1 GB VPS, this is substantially safer than building Node and Maven workloads on the server.
