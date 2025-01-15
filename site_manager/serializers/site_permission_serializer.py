from rest_framework.serializers import ModelSerializer, ValidationError

from org_manager.validators import validate_org_ownership
from shared.exception_handling import ValidationErrors

from ..models import SitePermission


class SitePermissionSerializer(ModelSerializer):
    class Meta:
        model = SitePermission
        fields = (
            "site",
            "user_group",
            "can_view",
            "can_manage_iterations_and_layers",
            "access_type",
        )

    def validate(self, data):
        validation_errors = {}

        request = self.context["request"]
        is_owner_of_site = validate_org_ownership(request, data.get("site"))

        if not is_owner_of_site:
            validation_errors["site"] = ValidationErrors.SITE_NOT_FOUND.value

        if validation_errors:
            raise ValidationError(validation_errors)

        return super().validate(data)

    def create(self, validated_data):
        site_permission = SitePermission.objects.create(
            **validated_data,
            project=validated_data["site"].project,
        )
        return site_permission


class GetSitePermissionSerializer(ModelSerializer):
    class Meta:
        model = SitePermission
        fields = (
            "user_group",
            "can_view",
            "can_manage_iterations_and_layers",
            "access_type",
        )
