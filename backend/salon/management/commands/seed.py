import os
from django.core.management.base import BaseCommand
from salon.models import User, Category, Treatment

class Command(BaseCommand):
    help = "Seed MINA salon treatments and optional admin account."

    def handle(self, *args, **options):
        categories = {}
        for name, slug in [("Lice", "lice"), ("Telo", "telo"), ("Masaže", "masaze"), ("Depilacija", "depilacija"), ("Wellness", "wellness")]:
            categories[slug], _ = Category.objects.get_or_create(slug=slug, defaults={"name": name})

        treatments = [
            ("Čišćenje lica", 1500, 60, "lice", False),
            ("Facijalni tretman", 2500, 60, "lice", True),
            ("Anti-age tretman", 3000, 75, "lice", False),
            ("Masaža celog tela", 2000, 60, "masaze", True),
            ("Limfna drenaža", 1800, 60, "telo", False),
            ("Tretman tela", 2800, 60, "telo", True),
            ("Depilacija", 1500, 30, "depilacija", True),
            ("Wellness paket", 4500, 90, "wellness", True),
        ]
        for name, price, duration, slug, popular in treatments:
            Treatment.objects.get_or_create(
                name=name,
                defaults={"price_rsd": price, "duration_min": duration, "category": categories[slug], "popular": popular},
            )

        admin_email = (os.getenv("ADMIN_EMAIL") or "").strip().lower()
        admin_password = os.getenv("ADMIN_PASSWORD") or ""
        admin_name = os.getenv("ADMIN_NAME") or "MINA Admin"
        if admin_email and admin_password:
            admin, _ = User.objects.get_or_create(username=admin_email, defaults={"email": admin_email})
            admin.email = admin_email
            admin.full_name = admin.full_name or admin_name
            admin.role = "ADMIN"
            admin.is_staff = True
            admin.is_superuser = True
            admin.set_password(admin_password)
            admin.save()
            self.stdout.write(self.style.SUCCESS(f"Admin nalog je spreman: {admin_email}"))
        else:
            self.stdout.write("ADMIN_EMAIL i ADMIN_PASSWORD nisu postavljeni; admin nalog nije kreiran.")

        self.stdout.write(self.style.SUCCESS("Seed završen."))
