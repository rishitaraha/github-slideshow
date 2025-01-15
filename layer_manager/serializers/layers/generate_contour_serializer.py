from django.shortcuts import get_object_or_404
from django.urls import reverse
from rest_framework import serializers, status

from iteration_manager.models import Iteration
from org_manager.validators import validate_org_ownership
from shared.aws import ContourGeneratorPayloadSchema, invoke_generate_contour
from shared.constants import FileStatus, FileType
from shared.exception_handling import ValidationErrors
from shared.validators import is_polygon

from ...constants import LayerFileFormat, LayerType
from ...helpers import prepare_layer_file_info
from ...models import LayerFile
from .create_layer_serializer import CreateLayerSerializer


class GenerateContourSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    iteration = serializers.UUIDField()
    polygon_wkt = serializers.CharField(required=False, allow_null=True)
    access_tags = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=True,
        required=False,
        allow_null=True,
    )
    minor_interval = serializers.FloatField()
    major_interval = serializers.FloatField()
    lowest_altitude = serializers.FloatField()
    highest_altitude = serializers.FloatField()
    threshold_value = serializers.FloatField()
    smoothing_filter_size = serializers.IntegerField()

    def validate(self, data):
        validated_data = super().validate(data)
        validation_errors = {}
        request = self.context["request"]

        iteration = get_object_or_404(Iteration, id=data["iteration"])

        # Validate ownership of iteration.
        is_owner_of_iteration = validate_org_ownership(request, iteration)
        if not is_owner_of_iteration:
            validation_errors["iteration"] = ValidationErrors.ITERATION_NOT_FOUND.value

        # Validating polygon wkt.
        if data.get("polygon_wkt") and not is_polygon(data["polygon_wkt"]):
            validation_errors[
                "polygon_wkt"
            ] = ValidationErrors.INVALID_POLYGON_WKT.value

        # Validate: Major interval should be in multiple of minor interval.
        if data["major_interval"] % data["minor_interval"] != 0:
            validation_errors[
                "major_interval"
            ] = ValidationErrors.INVALID_MAJOR_INTERVAL.value

        # TODO: Validate lowest and highest elevation.

        if validation_errors:
            raise serializers.ValidationError(validation_errors)

        validated_data["iteration"] = iteration
        return validated_data

    def create(self, data):
        request = self.context["request"]

        # Creating layer for contour.
        iteration = data["iteration"]

        layer_properties = {
            "minor_interval": data["minor_interval"],
            "major_interval": data["major_interval"],
            "lowest_altitude": data["lowest_altitude"],
            "highest_altitude": data["highest_altitude"],
            "threshold_value": data["threshold_value"],
            "smoothing_filter_size": data["smoothing_filter_size"],
        }

        create_layer_payload = {
            "name": data["name"],
            "iteration": iteration.id,
            "site": iteration.site_id,
            "type": LayerType.CONTOUR.value,
            "access_tags": data.get("access_tags"),
            "properties": layer_properties,
        }

        layer_serializer = CreateLayerSerializer(
            data=create_layer_payload,
            context={"logged_user": self.context["request"].user},
        )
        layer_serializer.is_valid(raise_exception=True)
        layer_serializer.save()
        layer_info = layer_serializer.data

        # Attaching contour files to be generated with layer.
        contour_gpkg_file_info = prepare_layer_file_info(
            file_format=LayerFileFormat.GPKG,
            filename_prefix=data["name"] + "_CONTOUR",
            filetype=FileType.VECTORS,
            org=request.user.org,
        )

        contour_dxf_file_info = prepare_layer_file_info(
            file_format=LayerFileFormat.DXF,
            filename_prefix=data["name"] + "_CONTOUR",
            filetype=FileType.VECTORS,
            org=request.user.org,
        )

        contour_gpkg_layer_file = LayerFile.objects.create(
            layer_id=layer_info["id"], file_info=contour_gpkg_file_info
        )

        contour_dxf_layer_file = LayerFile.objects.create(
            layer_id=layer_info["id"], file_info=contour_dxf_file_info
        )

        # Preparing payloads for contours generator lambda.
        gpkg_file_update_status_url = reverse(
            "layer-files-status",
            kwargs={
                "pk": str(contour_gpkg_layer_file.id),
            },
        )

        dxf_file_update_status_url = reverse(
            "layer-files-status",
            kwargs={
                "pk": str(contour_dxf_layer_file.id),
            },
        )

        contour_generator_payload: ContourGeneratorPayloadSchema = {
            "dsm_s3_key": iteration.captured_dsm.s3_key,
            "polygon_wkt": data.get("polygon_wkt"),
            "minor_interval": data["minor_interval"],
            "major_interval": data["major_interval"],
            "lowest_elevation": data["lowest_altitude"],
            "highest_elevation": data["highest_altitude"],
            "threshold_value": data["threshold_value"],
            "filter_size": data["smoothing_filter_size"],
            "gpkg_output_s3_key": contour_gpkg_file_info.s3_key,
            "gpkg_update_status_url": gpkg_file_update_status_url,
            "dxf_output_s3_key": contour_dxf_file_info.s3_key,
            "dxf_update_status_url": dxf_file_update_status_url,
        }

        # Invoking lambda.
        lambda_status = invoke_generate_contour(contour_generator_payload)

        if lambda_status == status.HTTP_202_ACCEPTED:
            contour_gpkg_file_info.status = FileStatus.STARTED.value
            contour_dxf_file_info.status = FileStatus.STARTED.value
        else:
            contour_gpkg_file_info.status = FileStatus.FAILED.value
            contour_dxf_file_info.status = FileStatus.FAILED.value

        contour_gpkg_file_info.save()
        contour_dxf_file_info.save()

        # Adding layer to the data so that we can return it to user.
        data["layer"] = layer_info
        return data

    def to_representation(self, instance):
        # Returning layer.
        return instance["layer"]
