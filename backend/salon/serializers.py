from rest_framework import serializers
from .models import User, Category, Treatment, Booking, BookingMessage, Notification

def public_user(user):
    return {
        "id": str(user.id),
        "fullName": user.full_name or user.get_full_name() or user.email,
        "email": user.email,
        "role": user.role,
        "walletRsd": user.wallet_rsd,
    }

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]

class TreatmentSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    priceRsd = serializers.IntegerField(source="price_rsd")
    durationMin = serializers.IntegerField(source="duration_min")
    imageUrl = serializers.CharField(source="image_url", allow_blank=True)

    class Meta:
        model = Treatment
        fields = ["id", "name", "description", "priceRsd", "durationMin", "imageUrl", "popular", "category"]

class UserPublicSerializer(serializers.ModelSerializer):
    fullName = serializers.SerializerMethodField()
    walletRsd = serializers.IntegerField(source="wallet_rsd")

    class Meta:
        model = User
        fields = ["id", "fullName", "email", "role", "walletRsd"]

    def get_fullName(self, obj):
        return obj.full_name or obj.get_full_name() or obj.email

class MessageSerializer(serializers.ModelSerializer):
    sender = UserPublicSerializer(read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = BookingMessage
        fields = ["id", "body", "sender", "createdAt"]

class BookingSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    treatment = TreatmentSerializer(read_only=True)
    startsAt = serializers.DateTimeField(source="starts_at")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = ["id", "user", "treatment", "startsAt", "location", "note", "status", "createdAt", "messages"]

class NotificationSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "title", "body", "read", "createdAt"]
