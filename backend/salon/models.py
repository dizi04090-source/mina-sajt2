from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (("USER", "Korisnik"), ("ADMIN", "Admin"))
    full_name = models.CharField(max_length=160, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="USER")
    wallet_rsd = models.IntegerField(default=0)

    @property
    def is_admin_role(self):
        return self.role == "ADMIN" or self.is_superuser

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.lower()
        if self.full_name and not (self.first_name or self.last_name):
            parts = self.full_name.split(" ", 1)
            self.first_name = parts[0]
            self.last_name = parts[1] if len(parts) > 1 else ""
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_name or self.email or self.username

class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Treatment(models.Model):
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    price_rsd = models.IntegerField()
    duration_min = models.IntegerField()
    image_url = models.URLField(blank=True)
    popular = models.BooleanField(default=False)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="treatments")

    def __str__(self):
        return self.name

class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Na čekanju"
        CONFIRMED = "CONFIRMED", "Potvrđeno"
        COMPLETED = "COMPLETED", "Završeno"
        CANCELLED = "CANCELLED", "Otkazano"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    treatment = models.ForeignKey(Treatment, on_delete=models.PROTECT, related_name="bookings")
    starts_at = models.DateTimeField()
    location = models.CharField(max_length=180, default="Mina Wellness Salon, Braće Radić 57, Subotica")
    note = models.TextField(blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["user"]), models.Index(fields=["starts_at"])]
        ordering = ["-starts_at"]

    def __str__(self):
        return f"{self.treatment} - {self.user} - {self.starts_at:%Y-%m-%d %H:%M}"

class BookingMessage(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="messages")
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender}: {self.body[:40]}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=160)
    body = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

class Conversation(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="salon_conversation")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

class ContactMessage(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    body = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]
