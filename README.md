# MINA Wellness Salon
Struktura: `backend/` (Django + Django Admin + API), `frontend/` (Next.js + Tailwind), `render.yaml` (Render Blueprint).

## Lokalno
Backend: `cd backend && cp .env.example .env && pip install -r requirements.txt && python manage.py migrate && python manage.py seed && python manage.py runserver`
Frontend: `cd frontend && cp .env.example .env.local && npm i && npm run dev`

Admin nalog se kreira iz backend `.env` vrednosti:

```
ADMIN_NAME="MINA Admin"
ADMIN_EMAIL="tvoj-admin-email"
ADMIN_PASSWORD="duga-jaka-lozinka"
```

Posle toga pokreni `python manage.py seed` u `backend/`.

Django admin panel:

```text
http://localhost:8000/admin
```

Na Renderu:

```text
https://mina-api-2785.onrender.com/admin
```

Admin može da doda nove admin naloge iz admin panela na sajtu. Backend endpoint je:

`POST /api/admin/admins`

Body:

```json
{
  "fullName": "Ime Admina",
  "email": "admin@example.com",
  "password": "JakaLozinka123"
}
```

Endpoint traži postojeći admin JWT token, tako da obični korisnici ne mogu da prave admin naloge. Najlakše je ipak koristiti Django admin panel za ručno dodavanje korisnika, tretmana i zakazivanja.

## Render
Deploy ide preko Blueprint-a iz `render.yaml`.

Obavezno podesi ove Render environment vrednosti:

- `CORS_ORIGIN`: URL frontend servisa, npr. `https://mina-web.onrender.com`
- `NEXT_PUBLIC_API_URL`: URL backend servisa, npr. `https://mina-api.onrender.com`
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`: podaci za admin nalog

`SECRET_KEY` Render generiše automatski. Nemoj ga commitovati u GitHub.
