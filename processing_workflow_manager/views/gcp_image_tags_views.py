import time

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from iteration_manager.permissions.iteration_permissions import (
    HasManageDatasetPermission,
)
from org_manager.permissions import IsFeatureFlagEnabled
from processing_workflow_manager.models.gcp_models import (
    ApproxGCPImageTag,
    GCPImageTag,
    TaskGCP,
    TaskGeotagImage,
)
from processing_workflow_manager.permissions.task_permissions import IsApiKeyPresent
from rainbow import logger
from shared.exception_handling import ValidationErrors
from shared.exception_handling.api_errors.validation_errors import ValidationErrors

from ..models import GCP, GCPImageTag
from ..serializers import (
    ApproximateGCPImageTagsWithTaskGCPIdSerializer,
    GCPImageTagSerializer,
)


class GCPImageTagViewSet(ViewSet):
    permission_classes = [IsFeatureFlagEnabled, HasManageDatasetPermission]
    serializer_class = GCPImageTagSerializer

    @action(methods=["PUT"], detail=False, url_path="update", url_name="update")
    def update_gcp_tags(self, request):
        gcp_image_tag_serializer = self.serializer_class(data=request.data)
        gcp_image_tag_serializer.is_valid(raise_exception=True)
        validated_data = gcp_image_tag_serializer.validated_data

        gcp = validated_data.get("gcp")

        if iteration_dataset := gcp.iteration_dataset:
            site = iteration_dataset.iteration.site
            image_info = iteration_dataset.image_folder_path
            parent_dataset = iteration_dataset
        elif merged_dataset := gcp.merged_dataset:
            site = merged_dataset.site
            image_info = merged_dataset.input_image_s3_folder_info
            parent_dataset = merged_dataset

        self.check_object_permissions(self.request, site)

        gcp_image_tags_data = gcp_image_tag_serializer.update_gcp_image_tags(image_info)

        if GCPImageTag.objects.filter(gcp__in=parent_dataset.gcps.all()).exists():
            parent_dataset.is_gcp_tagged = True
        else:
            parent_dataset.is_gcp_tagged = False

        response = {
            "message": "gcp_image_tags_updated_successfully",
            "data": {"images": gcp_image_tags_data},
        }
        return Response(response)

    @action(detail=False, methods=["delete"], url_path="delete", url_name="delete")
    def untag_gcp_image_tags(self, request):
        gcp_id = request.GET.get("gcp")
        gcp = get_object_or_404(
            GCP.objects.all().select_related("iteration_dataset", "merged_dataset"),
            pk=gcp_id,
        )
        if not gcp_id:
            raise ValidationError(ValidationErrors.GCP_ID_NOT_PROVIDED.value)

        if gcp_image_tags := GCPImageTag.objects.filter(gcp=gcp):
            gcp_image_tags.delete()

        parent_dataset = gcp.iteration_dataset or gcp.merged_dataset

        if GCPImageTag.objects.filter(gcp__in=parent_dataset.gcps.all()).exists():
            parent_dataset.is_gcp_tagged = True
        else:
            parent_dataset.is_gcp_tagged = False

        return Response({"message": "gcp_image_tags_deleted_successfully"})

    # MCLI API
    # Check the MCLI box when there is a change made in this method
    @action(
        detail=False,
        methods=["post"],
        url_path="approx-gcp-image-tags",
        url_name="approx_gcp_image_tags",
        permission_classes=[IsApiKeyPresent],
    )
    def approx_gcp_image_tags(self, request):
        serializer = ApproximateGCPImageTagsWithTaskGCPIdSerializer(
            data=request.data.get("task_gcps"), many=True
        )
        serializer.is_valid(raise_exception=True)
        task_gcps = serializer.data
        task_gcp_ids = []
        task_geotag_ids = []
        for task_gcp in task_gcps:
            task_gcp_ids.append(task_gcp["task_gcp_id"])
            for approx_gcp_image_tag in task_gcp["approx_gcp_image_tags"]:
                task_geotag_ids.append(approx_gcp_image_tag["task_geotag_id"])

        task_gcp_record_details = (
            TaskGCP.objects.filter(id__in=task_gcp_ids)
            .select_related("gcp")
            .values_list("id", "gcp__id")
        )

        execution_start_time = time.time()
        len_task_gcp_record_details = len(task_gcp_record_details)
        execution_time = time.time() - execution_start_time

        logger.info(
            {
                "execution_time [db query] -> task_gcp_record_details": f"{execution_time:.3f} sec",
            }
        )

        if len_task_gcp_record_details != len(task_gcp_ids):
            response = {"message": "task_gcps_not_found", "data": {}}
            return Response(response, status=status.HTTP_404_NOT_FOUND)

        # PK is of type UUID.
        task_gcp_mapping = {
            str(task_gcp_id): gcp_id for task_gcp_id, gcp_id in task_gcp_record_details
        }

        # Delete previous approx tags for GCPs.
        gcp_ids_to_delete_approx_image_tags = list(task_gcp_mapping.values())

        task_geotag_record_details = (
            TaskGeotagImage.objects.filter(
                id__in=task_geotag_ids, is_image_available=True
            )
            .select_related("geotag_image")
            .values_list("id", "geotag_image__id")
        )

        execution_start_time = time.time()
        # TODO: Check this handling.
        task_geotag_mapping = dict(
            ((task_geotag_id), geotag_image_id)
            for task_geotag_id, geotag_image_id in task_geotag_record_details
        )
        execution_time = time.time() - execution_start_time
        logger.info(
            {
                "execution_time [db query] -> task_geotag_mapping": f"{execution_time:.3f} sec",
            }
        )

        approx_gcp_image_tags_to_create = []
        for task_gcp in task_gcps:
            current_task_gcp_id = task_gcp["task_gcp_id"]
            gcp_id = task_gcp_mapping.get(current_task_gcp_id)
            if not gcp_id:
                continue

            for approx_gcp_image_tag in task_gcp["approx_gcp_image_tags"]:
                task_geotag_id = approx_gcp_image_tag["task_geotag_id"]
                geotag_image_id = task_geotag_mapping.get(task_geotag_id)
                if not geotag_image_id:
                    continue

                approx_gcp_image_tags_to_create.append(
                    ApproxGCPImageTag(
                        gcp_id=gcp_id,
                        image_id=geotag_image_id,
                        image_x=approx_gcp_image_tag["image_x"],
                        image_y=approx_gcp_image_tag["image_y"],
                    )
                )

        execution_start_time = time.time()
        # Bulk create the instances
        with transaction.atomic():
            ApproxGCPImageTag.objects.filter(
                gcp__in=gcp_ids_to_delete_approx_image_tags
            ).delete()
            ApproxGCPImageTag.objects.bulk_create(approx_gcp_image_tags_to_create)
        execution_time = time.time() - execution_start_time

        logger.info(
            {
                "execution_time [db query] -> bulk create approximate_gcp_image_tag": f"{execution_time:.3f} sec",
            }
        )

        response = {
            "message": "gcp_information_updated_successfully",
            "data": {},
        }
        return Response(response, status=status.HTTP_201_CREATED)
