from rest_framework import serializers

from processing_workflow_manager.serializers import RetrieveIterationDatasetSerializer
from shared.serializers import (
    BatchJobSerializer,
    DynamicFieldsSerializerMixin,
    FileSerializer,
    GetFileInfoSerializer,
)

from ...models import Iteration


class IterationSerializer(DynamicFieldsSerializerMixin, serializers.ModelSerializer):
    captured_dsm = FileSerializer(read_only=True)
    captured_dsm_cog = FileSerializer(read_only=True)
    terrain_tiles = BatchJobSerializer(read_only=True)

    class Meta:
        model = Iteration
        fields = (
            "id",
            "name",
            "site",
            "info",
            "date",
            "terrain_tiles",
            "captured_dsm",
            "captured_dsm_cog",
        )


class EditIterationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Iteration
        fields = ("id", "name", "date", "info")
        read_only_fields = ("id",)


class RetrieveIterationSerializer(
    DynamicFieldsSerializerMixin, serializers.ModelSerializer
):
    captured_dsm = GetFileInfoSerializer()
    iteration_dataset = RetrieveIterationDatasetSerializer(source="processing_data")

    class Meta:
        model = Iteration
        fields = (
            "id",
            "name",
            "site",
            "date",
            "info",
            "captured_dsm",
            "iteration_dataset",
        )
