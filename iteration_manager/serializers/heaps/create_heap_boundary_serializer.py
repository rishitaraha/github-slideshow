from django.contrib.gis.geos import GEOSGeometry
from rest_framework import serializers

from analytics_engine_manager.operations import calculate_volume
from shared.exception_handling import ValidationErrors
from shared.validators import is_multi_polygon

from ...constants import BaseReference
from ...models import HeapBoundary, Iteration


class CreateHeapBoundarySerializer(serializers.ModelSerializer):
    class Meta:
        model = HeapBoundary
        fields = "__all__"
        read_only_fields = (
            "id",
            "centroid",
            "cut_volume",
            "fill_volume",
            "net_volume",
            "cut_weight",
            "fill_weight",
            "net_weight",
            "created_at",
            "updated_at",
        )
        extra_kwargs = {
            "base_reference": {"required": True},
            "category": {"required": True},
            "base_iteration": {
                "required": False,
                "default": None,
            },
            "geometry": {
                "required": True,
            },
        }

    def create(self, validated_data):
        iteration: Iteration = validated_data.get("iteration")
        base_reference = validated_data["base_reference"]

        base_dsm_s3_key = None
        if base_reference == BaseReference.OtherIterationDsm.value:
            base_iteration = validated_data.get("base_iteration")
            base_dsm_s3_key = base_iteration.get_dsm_or_404().s3_key

        elif base_reference == BaseReference.SiteBaseDsm.value:
            base_dsm_s3_key = iteration.site.get_base_dsm_or_404().s3_key

        # Calculating volume.
        volume, _ = calculate_volume(
            str(iteration.id),
            iteration.get_dsm_or_404().s3_key,
            validated_data["geometry"],
            base_dsm_s3_key,
        )

        cut_volume = volume.get("cut_volume")
        fill_volume = volume.get("fill_volume")
        net_volume = volume.get("net_volume")

        validated_data["cut_volume"] = cut_volume
        validated_data["fill_volume"] = fill_volume
        validated_data["net_volume"] = net_volume

        # Calculating weight.
        if bulk_density := validated_data["bulk_density"]:
            validated_data["cut_weight"] = cut_volume * bulk_density
            validated_data["fill_weight"] = fill_volume * bulk_density
            validated_data["net_weight"] = net_volume * bulk_density

        return super().create(validated_data)

    def validate(self, data):
        validated_data = data
        validation_errors = {}

        multipolygon_wkt = data.get("geometry")
        if not is_multi_polygon(multipolygon_wkt):
            validation_errors[
                "geometry"
            ] = ValidationErrors.INVALID_MULTI_POLYGON_WKT.value

        # Validate that each polygon inside multipolygon is valid.
        multipolygon = GEOSGeometry(multipolygon_wkt)
        for polygon in multipolygon:
            if not polygon.valid:
                validation_errors[
                    "geometry"
                ] = ValidationErrors.INVALID_POLYGON_WKT.value

        base_reference = data["base_reference"]
        if base_reference == BaseReference.OtherIterationDsm.value:
            base_iteration = validated_data.get("base_iteration")
            if base_iteration is None:
                validation_errors[
                    "base_iteration"
                ] = ValidationErrors.BASE_ITERATION_IS_REQUIRED.value

        else:
            validated_data.pop("base_iteration")

        if validation_errors:
            raise serializers.ValidationError(validation_errors)

        return super().validate(data)

    def to_representation(self, instance: HeapBoundary):
        """returning geojson with geometry field"""
        res = super().to_representation(instance)
        if res["geometry"] is not None:
            res["geometry"] = instance.geometry.wkt
        return res
