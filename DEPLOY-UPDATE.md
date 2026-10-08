# MINA update

The Django admin fix upgrades Django 5.1.2 to 5.2.18 LTS. The old version does
not support the Python 3.14 runtime shown in the Render logs. This update also
pins Python 3.13.9 through backend/.python-version and render.yaml.

## Render

1. Push the updated project to the connected GitHub branch.
2. On mina-api, set PYTHON_VERSION=3.13.9 if a Python version was manually set
   in the Environment panel. Existing explicit variables override the file.
3. Deploy mina-api with "Clear build cache & deploy".
4. Keep the backend Build Command:
   pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput && python manage.py seed
5. Keep the Start Command:
   gunicorn mina_backend.wsgi:application --bind 0.0.0.0:$PORT
6. Deploy mina-web. Its build command remains npm install && npm run build.
7. Keep NEXT_PUBLIC_API_URL set to https://mina-api-2785.onrender.com on mina-web.
   Keep CORS_ORIGIN set to the exact public frontend origin on mina-api.
8. Visit /health and /admin/ on the backend and test adding/editing records.

Keep existing DATABASE_URL, SECRET_KEY and administrator credentials. No
database reset is required. Migration 0002 preserves existing records.

## Local verification

Backend: python manage.py test salon
Frontend: npm run build

The browser verification covered desktop, laptop, mobile and small mobile
viewports. Screenshot artifacts live in the chat workspace's verification
directory and are not deployment assets.
