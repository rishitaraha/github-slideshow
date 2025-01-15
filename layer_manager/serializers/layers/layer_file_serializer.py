from rest_framework import serializers

from shared.serializers import FileSerializer, GetFileInfoSerializer

from ...models import LayerFile


class GetLayerFileInfoSerializer(serializers.ModelSerializer):
    file_info = GetFileInfoSerializer(read_only=True)

    class Meta:
        model = LayerFile
        fields = "__all__"

    def to_representation(self, instance):
        serialized_data = super().to_representation(instance)
        return serialized_data["file_info"]


class GetLayerFileSerializer(serializers.ModelSerializer):
    file_info = FileSerializer(read_only=True)

    class Meta:
        model = LayerFile
        fields = "__all__"

    def to_representation(self, instance):
        serialized_data = super().to_representation(instance)
        return serialized_data["file_info"]
