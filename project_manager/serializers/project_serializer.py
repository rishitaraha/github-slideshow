from rest_framework import serializers

from ..models import Project
from .project_permission_serializer import ProjectPermissionSerializer


class ProjectSerializer(serializers.ModelSerializer):
    total_sites = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = ("id", "name", "org", "total_sites", "created_at")
        extra_kwargs = {
            "created_at": {"read_only": True},
            "org": {"write_only": True},
        }


class RetrieveProjectSerializer(serializers.ModelSerializer):
    permissions = ProjectPermissionSerializer(many=True)

    class Meta:
        model = Project
        fields = ("id", "name", "permissions")


class UpdateProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name")
        read_only_fields = ("id",)
