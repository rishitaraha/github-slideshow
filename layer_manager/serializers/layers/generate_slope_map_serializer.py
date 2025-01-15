import time

from django.shortcuts import get_object_or_404
from django.urls import reverse
from rest_framework import serializers

from iteration_manager.models import Iteration
from org_manager.feature_flags import FeatureFlag
from org_manager.helpers import get_current_org
from org_manager.permissions import is_feature_flag_enabled
from org_manager.validators import validate_org_ownership
from shared.aws import SlopeMapGeneratorPayloadSchema, submit_slope_map_generator_job
from shared.constants import FileStatus, FileType
from shared.exception_handling import ValidationErrors
from shared.helpers import create_s3_file_key, slugify
from shared.models import FileInfo

from ...constants import LayerType
from .create_layer_serializer import CreateLayerSerializer


class GenerateSlopeMapSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    iteration = serializers.UUIDField()
    access_tags = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=True,
        required=False,
        allow_null=True,
    )

    def validate(self, data):
        validation_errors = {}
        validated_data = super().validate(data)

        request = self.context["request"]
        current_org = get_current_org(request)

        is_feature_flag_enabled(current_org, FeatureFlag.SLOPE_MAP)

        iteration = get_object_or_404(Iteration, id=data["iteration"])

        is_owner_of_iteration = validate_org_ownership(request, iteration)
        if not is_owner_of_iteration:
            validation_errors["iteration"] = ValidationErrors.ITERATION_NOT_FOUND.value

        if validation_errors:
            raise serializers.ValidationError(validation_errors)

        validated_data["iteration"] = iteration
        return validated_data

    def create(self, data):
        request = self.context["request"]

        iteration: Iteration = data["iteration"]

        dsm_s3_uri = iteration.get_dsm_or_404().s3_uri

        # Creating FileInfo object for slope map.
        filename = f"{slugify(data['name'])}_SLOPE_MAP_{time.strftime('%d-%m-%Y')}.tif"
        slope_map_file_info: FileInfo = FileInfo.objects.create(
            name=filename, type=FileType.SLOPE_MAP.value, org=request.user.org
        )

        create_layer_payload = {
            "name": data["name"],
            "iteration": iteration.id,
            "site": iteration.site_id,
            "type": LayerType.SLOPE_MAP.value,
            "access_tags": data.get("access_tags"),
            "file_id": slope_map_file_info.id,
        }

        # Creating layer.
        layer_serializer = CreateLayerSerializer(
            data=create_layer_payload,
            context={"logged_user": self.context["request"].user},
        )
        layer_serializer.is_valid(raise_exception=True)
        layer_serializer.save()

        # Preparing payloads for slope map generator batch job.
        slope_map_s3_key = create_s3_file_key(
            FileType.SLOPE_MAP.value, f"{str(slope_map_file_info.id)}.tif"
        )

        update_status_url = reverse(
            "files-status",
            kwargs={
                "pk": str(slope_map_file_info.id),
            },
        )

        slope_map_file_info.s3_key = slope_map_s3_key

        slope_map_generator_payload: SlopeMapGeneratorPayloadSchema = {
            "resource_id": str(slope_map_file_info.id),
            "input_s3_uri": dsm_s3_uri,
            "output_s3_uri": f"{slope_map_file_info.bucket_name}/{slope_map_s3_key}",
            "update_status_url": update_status_url,
            "org_name": iteration.site.project.org.name,
            "project_name": iteration.site.project.name,
            "site_name": iteration.site.name,
            "iteration_name": iteration.name,
            "layer_name": data["name"],
        }

        batch_job_object = submit_slope_map_generator_job(
            slugify(data["name"]), slope_map_generator_payload
        )

        slope_map_file_info.batch_job = batch_job_object
        slope_map_file_info.status = FileStatus.STARTED.value
        slope_map_file_info.save()

        # Adding layer to the data so that we can return it to user.
        data["layer"] = layer_serializer.data
        return data

    def to_representation(self, instance):
        # Returning layer.
        return instance["layer"]
