from django.urls import path
from . import views

urlpatterns = [
    path("auth/register", views.register),
    path("auth/login", views.login),
    path("users/profile", views.profile),
    path("treatments", views.treatments),
    path("treatments/<int:pk>", views.treatment_detail),
    path("bookings", views.create_booking),
    path("bookings/my", views.my_bookings),
    path("bookings/<int:pk>", views.cancel_booking),
    path("bookings/<int:pk>/messages", views.booking_messages),
    path("admin/overview", views.admin_overview),
    path("admin/users", views.admin_users),
    path("admin/admins", views.admin_admins),
    path("admin/bookings", views.admin_bookings),
    path("admin/bookings/<int:pk>", views.admin_booking_status),
]
