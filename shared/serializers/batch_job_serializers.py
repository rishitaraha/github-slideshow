from rest_framework import serializers

from ..constants import BatchJobStatus
from ..models import BatchJob


class BatchJobSerializer(serializers.ModelSerializer):
    # https://www.django-rest-framework.org/api-guide/fields/#serializermethodfield
    path = serializers.SerializerMethodField()
    status = serializers.CharField()

    def get_path(self, obj):
        batch_output_s3_key = obj.get_env_variable("OUTPUT_S3_KEY")
        if batch_output_s3_key:
            return batch_output_s3_key.get("value")

    class Meta:
        model = BatchJob
        fields = ("path", "status")


class UpdateBatchJobStatusSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=BatchJobStatus.choices())

    class Meta:
        model = BatchJob
        fields = (
            "status",
            "started_at",
            "stopped_at",
        )
