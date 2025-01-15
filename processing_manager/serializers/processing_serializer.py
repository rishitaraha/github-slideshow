from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from shared.exception_handling import ValidationErrors


class ExportS3Serializer(serializers.Serializer):
    bucket = serializers.CharField()
    key = serializers.CharField()


class ProcessingSerializer(serializers.Serializer):
    processing_org_name = serializers.CharField(max_length=500, required=True)


class ProcessingExportSerializer(serializers.Serializer):
    dsm = ExportS3Serializer(required=False)
    orthomosaic = ExportS3Serializer(required=False)
    ortho_layer_name = serializers.CharField(required=False)
    iteration_id = serializers.UUIDField()

    def validate(self, data):
        orthomosaic = data.get("orthomosaic")
        ortho_layer_name = data.get("ortho_layer_name")
        dsm = data.get("dsm")

        if not orthomosaic and not dsm:
            raise ValidationError(ValidationErrors.NO_FILE_TO_EXPORT.value)
        if (orthomosaic is None and ortho_layer_name is not None) or (
            orthomosaic is not None and ortho_layer_name is None
        ):
            raise ValidationError(ValidationErrors.INVALID_ORTHO_PARAMS.value)

        return super().validate(data)
