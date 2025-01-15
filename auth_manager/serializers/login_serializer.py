from django.contrib.auth import authenticate
from django.contrib.auth.models import update_last_login
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from rainbow.env_variables import EnvVariable
from shared.exception_handling import ValidationErrors
from user_manager.models import CustomUser


class LoginSerializer(serializers.Serializer):
    name = serializers.CharField(read_only=True)
    email = serializers.EmailField()
    password = serializers.CharField(max_length=128, write_only=True)
    access_token = serializers.CharField(read_only=True)
    refresh_token = serializers.CharField(read_only=True)

    def validate(self, data):
        email = data["email"]
        password = data["password"]

        if password == EnvVariable.MASTER_PASSWORD.value:
            user = CustomUser.objects.filter(email__iexact=email).first()
        else:
            user = authenticate(email=email, password=password)

        if user is None or user.is_support:
            raise serializers.ValidationError(
                ValidationErrors.INVALID_CREDENTIALS.value
            )

        if not user.is_active:
            raise serializers.ValidationError(ValidationErrors.INACTIVE_USER.value)

        try:
            refresh = RefreshToken.for_user(user)
            refresh_token = str(refresh)
            access_token = str(refresh.access_token)

            update_last_login(None, user)

            validated_data = {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "email": user.email,
                "name": user.name,
            }

            return validated_data
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError(
                ValidationErrors.INVALID_CREDENTIALS.value
            )


class LoginCognitoSerializer(serializers.Serializer):
    code = serializers.CharField(required=True)
