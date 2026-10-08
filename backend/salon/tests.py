from datetime import timedelta

from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Booking, BookingMessage, Category, Notification, Treatment, User


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
