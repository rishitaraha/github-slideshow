from rest_framework import serializers


class CheckTerrainTilePermissionSerializer(serializers.Serializer):
    iteration = serializers.UUIDField()
    s3_key = serializers.CharField()
