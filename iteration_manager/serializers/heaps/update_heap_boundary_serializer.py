from decimal import Decimal

from django.core.serializers import serialize
from rest_framework import serializers

from ...models import HeapBoundary


class UpdateHeapBoundarySerializer(serializers.ModelSerializer):
    class Meta:
        model = HeapBoundary
        fields = (
            "id",
            "name",
            "bulk_density",
            "geometry",
            "cut_volume",
            "fill_volume",
            "net_volume",
            "cut_weight",
            "fill_weight",
            "net_weight",
            "remarks",
            "material_type",
            "included_in_kpi",
            "category",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "cut_volume",
            "fill_volume",
            "net_volume",
            "cut_weight",
            "fill_weight",
            "net_weight",
            "created_at",
            "updated_at",
        )

    def update(self, instance, validated_data):
        data = validated_data.copy()
        if data.get("bulk_density") == None:
            # If bulk_density is null, then update all weight to null.
            data["cut_weight"] = None
            data["fill_weight"] = None
            data["net_weight"] = None
        else:
            bulk_density = Decimal(data.get("bulk_density"))
            data["cut_weight"] = instance.cut_volume * bulk_density
            data["fill_weight"] = instance.fill_volume * bulk_density
            data["net_weight"] = instance.net_volume * bulk_density
        return super().update(instance, data)

    def to_representation(self, instance):
        """returning geojson with geometry field"""
        result = super().to_representation(instance)
        if result.get("geometry"):
            result["geometry"] = serialize(
                "geojson",
                [instance],
                geometry_field="geometry",
                fields=("name",),
            )
        return result
