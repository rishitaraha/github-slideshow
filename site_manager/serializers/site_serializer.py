from rest_framework import serializers

from shared.serializers import DynamicFieldsSerializerMixin, GetFileInfoSerializer

from ..models import Site
from ..permissions import has_manage_iterations_and_layers_permission


class SiteSerializer(DynamicFieldsSerializerMixin, serializers.ModelSerializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    can_manage_iterations_and_layers = serializers.SerializerMethodField(read_only=True)

    def get_can_manage_iterations_and_layers(self, site: Site):
        if user := self.context.get("user"):
            return user.is_org_admin or has_manage_iterations_and_layers_permission(
                user, site
            )

    class Meta:
        model = Site
        fields = (
            "id",
            "name",
            "latitude",
            "longitude",
            "project",
            "type",
            "boundary",
            "created_at",
            "updated_at",
            "can_manage_iterations_and_layers",
        )


class RetrieveSiteSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    base_dsm = GetFileInfoSerializer()
    legend_image = GetFileInfoSerializer()

    class Meta:
        model = Site
        fields = (
            "id",
            "name",
            "latitude",
            "longitude",
            "project",
            "type",
            "boundary",
            "base_dsm",
            "legend_image",
            "created_at",
            "updated_at",
        )


class UpdateSiteSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()

    class Meta:
        model = Site
        fields = (
            "id",
            "name",
            "latitude",
            "longitude",
            "type",
            "boundary",
        )
        read_only_fields = ("id",)
