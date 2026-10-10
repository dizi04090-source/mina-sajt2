from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed


class SalonJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if validated_token.get('version', 0) != user.token_version:
            raise AuthenticationFailed('Sesija je istekla. Prijavite se ponovo.')
        return user
