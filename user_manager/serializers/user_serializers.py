from django.contrib.auth.password_validation import validate_password
from django.forms import ValidationError
from rest_framework import serializers

from shared.exception_handling import ValidationErrors

from ..constants import UserType
from ..models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    type = serializers.ChoiceField(choices=UserType.org_admin_choices())

    class Meta:
        model = CustomUser
        fields = (
            "id",
            "email",
            "password",
            "first_name",
            "last_name",
            "type",
            "org",
            "is_active",
            "last_login",
        )
        read_only_fields = (
            "id",
            "is_active",
            "last_login",
        )
        extra_kwargs = {
            "password": {"write_only": True},
            "org": {"write_only": True},
        }

    def validate(self, data):
        validation_errors = {}
        try:
            validate_password(data["password"])
        except ValidationError as error:
            validation_errors["password"] = error

        # FIXME: Remove query.
        if CustomUser.objects.filter(email__iexact=data["email"]).exists():
            validation_errors["email"] = ValidationErrors.EMAIL_ALREADY_EXISTS.value

        if validation_errors:
            raise ValidationError(validation_errors)
        return data

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    type = serializers.ChoiceField(choices=UserType.org_admin_choices())

    class Meta:
        model = CustomUser
        fields = (
            "id",
            "first_name",
            "last_name",
            "type",
            "is_active",
            "last_login",
        )
        read_only_fields = ("id", "last_login")
