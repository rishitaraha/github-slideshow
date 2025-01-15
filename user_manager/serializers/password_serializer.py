from django.contrib.auth.password_validation import validate_password
from django.forms import ValidationError
from rest_framework import serializers

from shared.exception_handling import ValidationErrors


class ChangePasswordSerializer(serializers.Serializer):
    user_id = serializers.CharField(required=False)
    old_password = serializers.CharField(required=False)
    new_password = serializers.CharField()
    confirm_new_password = serializers.CharField()

    def create(self, validated_date):
        pass

    def update(self, instance, validated_data):
        instance.set_password(validated_data["new_password"])
        instance.save()
        return instance

    def validate(self, data):
        if not data.get("user_id", False):
            if not data.get("old_password", False):
                raise serializers.ValidationError(
                    ValidationErrors.OLD_PASSWORD_REQUIRED.value
                )
            if not self.instance.check_password(data["old_password"]):
                raise serializers.ValidationError(
                    ValidationErrors.OLD_PASSWORD_INCORRECT.value
                )

        if data["new_password"] != data["confirm_new_password"]:
            raise serializers.ValidationError(
                ValidationErrors.PASSWORDS_DO_NOT_MATCH.value
            )

        validation_errors = {}
        try:
            validate_password(data["new_password"])
        except ValidationError as error:
            validation_errors["form"] = error
            raise ValidationError(validation_errors)

        validated_data = {"new_password": data["new_password"]}
        return validated_data
