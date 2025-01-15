from rest_framework.serializers import ModelSerializer, ValidationError

from org_manager.validators import validate_org_ownership
from shared.exception_handling import ValidationErrors

from ..models import ProjectPermission


class ProjectPermissionSerializer(ModelSerializer):
    def validate(self, data):
        validation_errors = {}

        request = self.context["request"]
        is_owner_of_project = validate_org_ownership(request, data.get("project"))

        if not is_owner_of_project:

            validation_errors["project"] = ValidationErrors.PROJECT_NOT_FOUND.value

        if validation_errors:
            raise ValidationError(validation_errors)

        return super().validate(data)

    class Meta:
        model = ProjectPermission
        fields = (
            "project",
            "user_group",
            "can_view",
            "can_manage_sites",
        )
