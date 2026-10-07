from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Category, Treatment, Booking, BookingMessage, Notification

@admin.register(User)
class MinaUserAdmin(UserAdmin):
    list_display = ("email", "full_name", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("email", "full_name", "username")
    fieldsets = UserAdmin.fieldsets + (("MINA", {"fields": ("full_name", "role", "wallet_rsd")}),)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}

@admin.register(Treatment)
class TreatmentAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price_rsd", "duration_min", "popular")
    list_filter = ("category", "popular")
    search_fields = ("name", "description")

class BookingMessageInline(admin.TabularInline):
    model = BookingMessage
    extra = 0
    readonly_fields = ("created_at",)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("treatment", "user", "starts_at", "status", "created_at")
    list_filter = ("status", "treatment__category", "starts_at")
    search_fields = ("user__email", "user__full_name", "treatment__name", "note")
    date_hierarchy = "starts_at"
    inlines = [BookingMessageInline]

@admin.register(BookingMessage)
class BookingMessageAdmin(admin.ModelAdmin):
    list_display = ("booking", "sender", "created_at")
    search_fields = ("body", "sender__email", "booking__treatment__name")

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "read", "created_at")
    list_filter = ("read", "created_at")
    search_fields = ("title", "body", "user__email")
