# MINA Wellness Salon
Struktura: `backend/` (Express + Prisma), `frontend/` (Next.js + Tailwind), `render.yaml` (Render Blueprint).

## Lokalno
Backend: `cd backend && cp .env.example .env && npm i && npx prisma db push && npm run seed && npm run dev`
Frontend: `cd frontend && cp .env.example .env.local && npm i && npm run dev`

Demo korisnik: `ana.petrovic@email.com` / `Lozinka123`

Admin nalog se kreira iz backend `.env` vrednosti:

```
ADMIN_NAME="MINA Admin"
ADMIN_EMAIL="tvoj-admin-email"
ADMIN_PASSWORD="duga-jaka-lozinka"
```

Posle toga pokreni `npm run seed` u `backend/`.

## Render
Deploy ide preko Blueprint-a iz `render.yaml`.

Obavezno podesi ove Render environment vrednosti:

- `CORS_ORIGIN`: URL frontend servisa, npr. `https://mina-web.onrender.com`
- `NEXT_PUBLIC_API_URL`: URL backend servisa, npr. `https://mina-api.onrender.com`
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`: podaci za admin nalog

`JWT_SECRET` Render generiše automatski. Nemoj ga commitovati u GitHub.
