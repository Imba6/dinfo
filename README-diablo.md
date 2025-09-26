# Diablo Stack (No Nginx)
- Vite+React built with base `/diablo/` and served by FastAPI.
- API mounted under `/diablo/api/*` with pre-shared key auth for writes.

## Steps
1) Ensure Vite base is `/diablo/` in `vite.config.*` (this patch tried to set it).
2) Build & run:
   ```bash
   docker compose up -d --build
   # open http://localhost:8080/diablo/
   # health: http://localhost:8080/diablo/health
   ```
3) Upsert example:
   ```bash
   curl -X POST http://localhost:8080/diablo/api/clans/upsert      -H "Content-Type: application/json"      -H "X-API-Key: YOUR_SECRET"      -d '{ "id":"clan-1","name":"My Clan","rank":1,"immortalRank":0,"members":[] }'
   ```

## Notes
- Writes require `X-API-Key` header.
- DB: Postgres 16 with default credentials set in `.env`.
