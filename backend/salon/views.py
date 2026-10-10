from datetime import datetime, timedelta
import base64
import binascii
import re
from io import BytesIO
from PIL import Image, UnidentifiedImageError
from django.db import IntegrityError, transaction
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth import authenticate
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Category, Treatment, Booking, BookingMessage, Notification, Conversation, ContactMessage
from .serializers import public_user, TreatmentSerializer, BookingSerializer, MessageSerializer, UserPublicSerializer

def make_token(user, remember=False):
    refresh = RefreshToken.for_user(user)
    refresh['version'] = user.token_version
    access = refresh.access_token
    if remember:
        access.set_exp(lifetime=timedelta(days=30))
    return str(access)

def is_admin(user):
    return user.is_authenticated and user.is_admin_role

def admin_required(fn):
    def wrapper(request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({"error": "Nemate pristup admin panelu"}, status=403)
        return fn(request, *args, **kwargs)
    return wrapper

def strong_password(password):
    return isinstance(password, str) and len(password) >= 8 and any(c.isalpha() for c in password) and any(c.isdigit() for c in password)

@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    full_name = (request.data.get("fullName") or request.data.get("full_name") or "").strip()
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    if not full_name or not email or not strong_password(password):
        return Response({"error": "Unesite ime, email i lozinku sa najmanje 8 znakova, slovom i brojem"}, status=400)
    if User.objects.filter(email=email).exists():
        return Response({"error": "Email je već registrovan"}, status=409)
    user = User.objects.create_user(username=email, email=email, password=password, full_name=full_name, role="USER")
    return Response({"token": make_token(user), "user": public_user(user)}, status=201)

@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    remember = bool(request.data.get("remember"))
    try:
        account = User.objects.get(email__iexact=email)
    except (User.DoesNotExist, User.MultipleObjectsReturned):
        account = None
    user = authenticate(username=account.username, password=password) if account else None
    if not user:
        return Response({"error": "Pogrešan email ili lozinka"}, status=401)
    return Response({"token": make_token(user, remember), "user": public_user(user)})

@api_view(["GET", "PATCH"])
def profile(request):
    if request.method == 'PATCH':
        allowed = {'fullName', 'username', 'avatar'}
        if set(request.data) - allowed:
            return Response({'error': 'Nepodržano polje profila.'}, status=400)
        user = request.user
        name = request.data.get('fullName', user.full_name)
        username = request.data.get('username', user.username)
        avatar = request.data.get('avatar', user.avatar)
        if not isinstance(name, str) or not name.strip() or len(name.strip()) > 160:
            return Response({'error': 'Unesite ime i prezime (do 160 znakova).'}, status=400)
        if not isinstance(username, str) or (username != user.username and not re.fullmatch(r'[A-Za-z0-9._-]{3,30}', username)):
            return Response({'error': 'Korisničko ime: 3–30 slova, brojeva, tačaka, crtica ili donjih crta.'}, status=400)
        if User.objects.filter(username__iexact=username).exclude(pk=user.pk).exists():
            return Response({'error': 'Korisničko ime je već zauzeto.'}, status=409)
        if not isinstance(avatar, str) or len(avatar) > 200000:
            return Response({'error': 'Slika je prevelika.'}, status=400)
        if avatar:
            try:
                prefix, content = avatar.split(',', 1)
                if prefix != 'data:image/jpeg;base64':
                    raise ValueError()
                image = Image.open(BytesIO(base64.b64decode(content, validate=True)))
                if image.format != 'JPEG' or max(image.size) > 512:
                    raise ValueError()
                image.verify()
            except (ValueError, binascii.Error, UnidentifiedImageError, OSError, Image.DecompressionBombError):
                return Response({'error': 'Izaberite ispravnu sliku profila.'}, status=400)
        user.full_name = name.strip()
        user.username = username
        user.avatar = avatar
        try:
            with transaction.atomic():
                user.save(update_fields=['full_name', 'username', 'avatar'])
        except IntegrityError:
            return Response({'error': 'Korisničko ime je već zauzeto.'}, status=409)
    return Response(public_user(request.user))


@api_view(['POST'])
def change_password(request):
    with transaction.atomic():
        user = User.objects.select_for_update().get(pk=request.user.pk)
        current = request.data.get('currentPassword', '')
        password = request.data.get('newPassword', '')
        if not isinstance(current, str) or not user.check_password(current):
            return Response({'error': 'Trenutna lozinka nije ispravna.'}, status=400)
        if not strong_password(password) or password == current:
            return Response({'error': 'Nova lozinka mora biti drugačija i imati najmanje 8 znakova, slovo i broj.'}, status=400)
        try:
            validate_password(password, user=user)
        except ValidationError:
            return Response({'error': 'Izaberite jaču lozinku koja nije previše jednostavna ili slična profilu.'}, status=400)
        user.set_password(password)
        user.token_version += 1
        user.save(update_fields=['password', 'token_version'])
    return Response({'token': make_token(user, bool(request.data.get('remember'))), 'user': public_user(user)})

@api_view(["GET"])
@permission_classes([AllowAny])
def treatments(request):
    qs = Treatment.objects.select_related("category").all().order_by("name")
    q = request.GET.get("q")
    category = request.GET.get("category")
    popular = request.GET.get("popular")
    if q:
        qs = qs.filter(name__icontains=q)
    if category and category != "svi":
        qs = qs.filter(category__slug=category)
    if popular:
        qs = qs.filter(popular=True)
    return Response(TreatmentSerializer(qs, many=True).data)

@api_view(["GET"])
@permission_classes([AllowAny])
def treatment_detail(request, pk):
    try:
        treatment = Treatment.objects.select_related("category").get(pk=pk)
    except Treatment.DoesNotExist:
        return Response({"error": "Tretman nije pronađen"}, status=404)
    return Response(TreatmentSerializer(treatment).data)

@api_view(["POST"])
def create_booking(request):
    treatment_id = request.data.get("treatmentId")
    date = request.data.get("date")
    time = request.data.get("time")
    note = (request.data.get("note") or "")[:1000]
    try:
        treatment = Treatment.objects.get(pk=treatment_id)
        starts_at = timezone.make_aware(datetime.fromisoformat(f"{date}T{time}:00"))
    except Exception:
        return Response({"error": "Izaberite validan termin"}, status=400)
    if starts_at < timezone.now():
        return Response({"error": "Izaberite termin u budućnosti"}, status=400)
    if Booking.objects.filter(starts_at=starts_at, status__in=["PENDING", "CONFIRMED"]).exists():
        return Response({"error": "Termin je zauzet, izaberite drugo vreme"}, status=409)
    booking = Booking.objects.create(user=request.user, treatment=treatment, starts_at=starts_at, note=note)
    if note:
        BookingMessage.objects.create(booking=booking, sender=request.user, body=note)
    Notification.objects.create(user=request.user, title="Zakazivanje primljeno", body=f"{treatment.name} čeka potvrdu.")
    return Response(BookingSerializer(booking).data, status=201)

@api_view(["GET"])
def my_bookings(request):
    all_bookings = Booking.objects.filter(user=request.user).select_related("user", "treatment", "treatment__category").prefetch_related("messages").order_by("starts_at")
    now = timezone.now()
    active = [b for b in all_bookings if b.status in ["PENDING", "CONFIRMED"] and b.starts_at >= now]
    active_ids = {b.id for b in active}
    history = [b for b in all_bookings if b.id not in active_ids]
    return Response({"active": BookingSerializer(active, many=True).data, "history": BookingSerializer(history, many=True).data})

@api_view(["DELETE"])
def cancel_booking(request, pk):
    try:
        booking = Booking.objects.get(pk=pk, user=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Zakazivanje nije pronađeno"}, status=404)
    booking.status = "CANCELLED"
    booking.save(update_fields=["status"])
    return Response(BookingSerializer(booking).data)

@api_view(["GET", "POST"])
def booking_messages(request, pk):
    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response({"error": "Zakazivanje nije pronađeno"}, status=404)
    if booking.user_id != request.user.id and not is_admin(request.user):
        return Response({"error": "Nemate pristup ovom razgovoru"}, status=403)
    if request.method == "GET":
        return Response(MessageSerializer(booking.messages.select_related("sender"), many=True).data)
    body = (request.data.get("body") or "").strip()[:1000]
    if not body:
        return Response({"error": "Poruka ne može biti prazna"}, status=400)
    msg = BookingMessage.objects.create(booking=booking, sender=request.user, body=body)
    if is_admin(request.user):
        Notification.objects.create(user=booking.user, title="Nova poruka za termin", body=body)
    return Response(MessageSerializer(msg).data, status=201)

@api_view(["GET"])
@admin_required
def admin_overview(request):
    bookings = Booking.objects.select_related("user", "treatment", "treatment__category").prefetch_related("messages").order_by("-starts_at")[:50]
    return Response({
        "counts": {
            "users": User.objects.count(),
            "bookings": Booking.objects.count(),
            "pending": Booking.objects.filter(status="PENDING").count(),
            "treatments": Treatment.objects.count(),
        },
        "bookings": BookingSerializer(bookings, many=True).data,
    })

@api_view(["GET"])
@admin_required
def admin_users(request):
    return Response(UserPublicSerializer(User.objects.all().order_by("-id"), many=True).data)

@api_view(["POST"])
@admin_required
def admin_admins(request):
    full_name = (request.data.get("fullName") or "").strip()
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    if not full_name or not email or not strong_password(password):
        return Response({"error": "Unesite ime, email i jaku lozinku"}, status=400)
    user = User.objects.filter(email=email).first()
    created = False
    if user:
        user.role = "ADMIN"
        user.is_staff = True
        user.full_name = user.full_name or full_name
        user.save()
    else:
        user = User.objects.create_user(username=email, email=email, password=password, full_name=full_name, role="ADMIN", is_staff=True)
        created = True
    return Response({"created": created, "user": public_user(user)}, status=201 if created else 200)

@api_view(["GET"])
@admin_required
def admin_bookings(request):
    qs = Booking.objects.select_related("user", "treatment", "treatment__category").prefetch_related("messages").order_by("-starts_at")
    status_q = request.GET.get("status")
    if status_q:
        qs = qs.filter(status=status_q)
    return Response(BookingSerializer(qs, many=True).data)

@api_view(["PATCH"])
@admin_required
def admin_booking_status(request, pk):
    try:
        booking = Booking.objects.select_related("user", "treatment").get(pk=pk)
    except Booking.DoesNotExist:
        return Response({"error": "Zakazivanje nije pronađeno"}, status=404)
    status_value = request.data.get("status")
    if status_value not in Booking.Status.values:
        return Response({"error": "Status nije validan"}, status=400)
    booking.status = status_value
    booking.save(update_fields=["status"])
    title = {"CONFIRMED": "Termin je potvrđen", "CANCELLED": "Termin je otkazan", "COMPLETED": "Termin je završen"}.get(status_value, "Status termina je promenjen")
    Notification.objects.create(user=booking.user, title=title, body=f"{booking.treatment.name}: {title.lower()}.")
    return Response(BookingSerializer(booking).data)

def contact_message_data(message):
    return {"id": message.pk, "body": message.body, "sender": public_user(message.sender), "createdAt": message.created_at.isoformat()}

@api_view(["GET", "POST"])
def my_conversation(request):
    if request.method == "GET":
        conversation = Conversation.objects.filter(user=request.user).first()
        return Response({"id": conversation.pk if conversation else None, "messages": [contact_message_data(m) for m in conversation.messages.select_related("sender")] if conversation else []})
    body = request.data.get("body")
    if not isinstance(body, str) or not body.strip() or len(body.strip()) > 1000:
        return Response({"error": "Unesite poruku od 1 do 1000 znakova"}, status=400)
    conversation, _ = Conversation.objects.get_or_create(user=request.user)
    message = ContactMessage.objects.create(conversation=conversation, sender=request.user, body=body.strip())
    conversation.save(update_fields=["updated_at"])
    return Response(contact_message_data(message), status=201)

@api_view(["GET"])
@admin_required
def admin_conversations(request):
    conversations = Conversation.objects.select_related("user").prefetch_related("messages").all()
    return Response([{"id": c.pk, "user": public_user(c.user), "updatedAt": c.updated_at.isoformat(), "lastMessage": list(c.messages.all())[-1].body if c.messages.all() else ""} for c in conversations])

@api_view(["GET", "POST"])
def conversation_messages(request, pk):
    try:
        conversation = Conversation.objects.select_related("user").get(pk=pk)
    except Conversation.DoesNotExist:
        return Response({"error": "Razgovor nije pronađen"}, status=404)
    if conversation.user_id != request.user.pk and not is_admin(request.user):
        return Response({"error": "Nemate pristup ovom razgovoru"}, status=403)
    if request.method == "GET":
        return Response([contact_message_data(m) for m in conversation.messages.select_related("sender")])
    body = request.data.get("body")
    if not isinstance(body, str) or not body.strip() or len(body.strip()) > 1000:
        return Response({"error": "Unesite poruku od 1 do 1000 znakova"}, status=400)
    message = ContactMessage.objects.create(conversation=conversation, sender=request.user, body=body.strip())
    conversation.save(update_fields=["updated_at"])
    if is_admin(request.user):
        Notification.objects.create(user=conversation.user, title="Nova poruka iz salona", body=body.strip())
    return Response(contact_message_data(message), status=201)
