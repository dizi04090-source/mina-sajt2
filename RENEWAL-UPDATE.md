# Mina website renewal

The homepage is now public on desktop and mobile. Sign-in is requested when a
visitor books, sends a message or opens their account. A chosen treatment is
retained through sign-in and registration.

The redesign uses the supplied salon photographs and portrait, the existing
Mina icon, a three-column desktop treatment grid, generous spacing and gentle
CSS entrance animations. Reduced-motion preferences are respected.

Clients can message Mina before booking. Administrators have a client inbox,
appointment approval controls and separate conversations for each appointment.
Messages are stored in the database and protected by owner/admin checks.
Open conversations refresh every 12 seconds while the page is visible and
also provide a manual refresh button.

The address is Braće Radić 57, Subotica, as listed at
https://www.sredime.rs/subotica/salon-mina-wellness . Existing treatment names
and prices are retained from the project; confirm them in the admin before launch.

## Publish the update

Push the changed project files to the connected GitHub branch, then deploy the
backend before the frontend. The existing backend build command runs
`python manage.py migrate`, which applies migration 0003 for the client inbox.
Keep the existing database, credentials and environment settings.
No database reset is needed. Existing appointments and conversations are preserved.

Frontend: keep NEXT_PUBLIC_API_URL set to the backend's public URL.
Backend: keep CORS_ORIGIN set to the frontend's public origin.
The optional MINA_BUILD_DIR setting is for local verification only; normal
Render builds continue to use .next.

## Verification

Nine backend tests passed, including public catalog access, authentication,
private appointment messages, pre-booking questions, admin replies and admin forms.
The production frontend build passed. Browser checks confirmed public browsing,
registration, retained treatment selection, booking, approval, both message
flows, personalized admin greeting and logout.
Browser layout checks at 320, 390, 1024 and 1440 pixels found no horizontal
overflow; the supplied website images loaded correctly.
