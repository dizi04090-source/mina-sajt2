from datetime import timedelta

from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Booking, BookingMessage, Category, Notification, Treatment, User, Conversation, ContactMessage


@override_settings(STORAGES={
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
})
class AdminFormsTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_superuser(
            username="admin@example.com", email="admin@example.com", password="Test-password-936"
        )
        cls.category = Category.objects.create(name="Lice", slug="lice")
        cls.treatment = Treatment.objects.create(
            name="Facial", category=cls.category, price_rsd=2500, duration_min=60
        )
        cls.booking = Booking.objects.create(
            user=cls.admin, treatment=cls.treatment, starts_at=timezone.now() + timedelta(days=1)
        )
        cls.message = BookingMessage.objects.create(
            booking=cls.booking, sender=cls.admin, body="Potvrda termina"
        )
        cls.notification = Notification.objects.create(user=cls.admin, title="Termin", body="Potvrdjen")

    def setUp(self):
        self.client.force_login(self.admin)

    def test_every_add_and_change_form_renders(self):
        for obj in [self.admin, self.category, self.treatment, self.booking, self.message, self.notification]:
            model = obj._meta.model_name
            with self.subTest(model=model, action="add"):
                self.assertEqual(self.client.get(reverse(f"admin:salon_{model}_add")).status_code, 200)
            with self.subTest(model=model, action="change"):
                self.assertEqual(self.client.get(reverse(f"admin:salon_{model}_change", args=[obj.pk])).status_code, 200)

    def test_category_can_be_added_and_edited(self):
        response = self.client.post(reverse("admin:salon_category_add"), {"name": "Body", "slug": "body", "_save": "Save"})
        self.assertEqual(response.status_code, 302)
        category = Category.objects.get(slug="body")
        response = self.client.post(reverse("admin:salon_category_change", args=[category.pk]), {"name": "Body care", "slug": "body", "_save": "Save"})
        self.assertEqual(response.status_code, 302)
        category.refresh_from_db()
        self.assertEqual(category.name, "Body care")

    def test_user_can_be_created_in_admin_and_log_in_via_api(self):
        password = "Customer-password-936"
        response = self.client.post(reverse("admin:salon_user_add"), {
            "username": "customer-handle", "email": "customer@example.com",
            "full_name": "Test Customer", "role": "USER", "usable_password": "true",
            "password1": password, "password2": password, "_save": "Save",
        })
        self.assertEqual(response.status_code, 302)
        response = self.client.post("/api/auth/login", {"email": "customer@example.com", "password": password})
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.json())

    def test_regular_user_cannot_access_admin(self):
        customer = User.objects.create_user(username="customer", password="Customer-password-936")
        self.client.force_login(customer)
        self.assertEqual(self.client.get(reverse("admin:salon_user_add")).status_code, 302)

    def test_booking_approval_and_private_messages_are_persisted(self):
        customer = User.objects.create_user(username="client@example.com", email="client@example.com")
        stranger = User.objects.create_user(username="stranger@example.com")
        client = APIClient()
        client.force_authenticate(customer)
        day = (timezone.localdate() + timedelta(days=7)).isoformat()
        response = client.post("/api/bookings", {"treatmentId": self.treatment.pk, "date": day, "time": "12:00", "note": "Pitanje o placanju"}, format="json")
        self.assertEqual(response.status_code, 201)
        booking = Booking.objects.get(pk=response.data["id"])
        self.assertEqual(booking.status, Booking.Status.PENDING)
        self.assertEqual(booking.messages.count(), 1)
        client.force_authenticate(stranger)
        self.assertEqual(client.get(f"/api/bookings/{booking.pk}/messages").status_code, 403)
        self.assertEqual(client.patch(f"/api/admin/bookings/{booking.pk}", {"status": "CONFIRMED"}, format="json").status_code, 403)
        client.force_authenticate(self.admin)
        self.assertEqual(client.patch(f"/api/admin/bookings/{booking.pk}", {"status": "CONFIRMED"}, format="json").status_code, 200)
        self.assertEqual(client.post(f"/api/bookings/{booking.pk}/messages", {"body": "Termin je potvrdjen"}, format="json").status_code, 201)
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.Status.CONFIRMED)
        client.force_authenticate(customer)
        self.assertEqual(len(client.get(f"/api/bookings/{booking.pk}/messages").data), 2)

class SalonConversationTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(username="customer", email="customer@example.com")
        self.stranger = User.objects.create_user(username="stranger", email="stranger@example.com")
        self.admin = User.objects.create_superuser(username="mina", email="mina@example.com", password="Test-password-936")
        self.client = APIClient()

    def test_public_catalog_and_protected_actions(self):
        self.assertEqual(self.client.get('/api/treatments').status_code, 200)
        for method, path in [('get', '/api/conversations/my'), ('post', '/api/conversations/my'), ('get', '/api/admin/conversations'), ('post', '/api/bookings')]:
            with self.subTest(path=path):
                self.assertEqual(getattr(self.client, method)(path).status_code, 401)

    def test_customer_cannot_open_any_admin_panel_endpoint(self):
        self.client.force_authenticate(self.customer)
        for path in ['/api/admin/overview', '/api/admin/users', '/api/admin/bookings', '/api/admin/conversations']:
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 403)
        self.assertEqual(self.client.post('/api/admin/admins', {}, format='json').status_code, 403)

    def test_question_before_booking_admin_reply_and_privacy(self):
        self.client.force_authenticate(self.customer)
        self.assertEqual(self.client.get('/api/conversations/my').data, {'id': None, 'messages': []})
        self.assertEqual(Conversation.objects.count(), 0)
        self.assertEqual(self.client.post('/api/conversations/my', {'body': 'Koju masažu preporučujete?'}, format='json').status_code, 201)
        conversation = Conversation.objects.get(user=self.customer)
        path = f'/api/conversations/{conversation.pk}/messages'
        self.assertEqual(Booking.objects.count(), 0)
        self.assertEqual(self.client.get('/api/admin/conversations').status_code, 403)
        self.client.force_authenticate(self.stranger)
        self.assertEqual(self.client.get(path).status_code, 403)
        self.assertEqual(self.client.post(path, {'body': 'Private'}, format='json').status_code, 403)
        self.client.force_authenticate(self.admin)
        overview = self.client.get('/api/admin/conversations')
        self.assertEqual(overview.status_code, 200)
        self.assertEqual(overview.data[0]['lastMessage'], 'Koju masažu preporučujete?')
        self.assertEqual(self.client.post(path, {'body': 'Možemo zajedno izabrati tretman.'}, format='json').status_code, 201)
        self.client.force_authenticate(self.customer)
        self.assertEqual(len(self.client.get('/api/conversations/my').data['messages']), 2)
        self.assertTrue(Notification.objects.filter(user=self.customer, title='Nova poruka iz salona').exists())

    def test_empty_and_oversized_messages_are_rejected(self):
        self.client.force_authenticate(self.customer)
        for body in ['', '  ', 'a' * 1001, 12]:
            self.assertEqual(self.client.post('/api/conversations/my', {'body': body}, format='json').status_code, 400)
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_superuser_profile_has_admin_role_and_username(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get('/api/users/profile')
        self.assertEqual(response.data['role'], 'ADMIN')
        self.assertEqual(response.data['username'], 'mina')
        self.assertEqual(response.data['fullName'], 'mina')
