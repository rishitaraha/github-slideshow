import tempfile
import zipfile

from django.core.files.uploadedfile import InMemoryUploadedFile
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from layer_manager.helpers.insert_bulk_feature import insert_bulk_features
from layer_manager.models.layer_models import Layer, LayerFile
from org_manager.permissions import IsFeatureFlagEnabled
from shared.background_task import BackgroundTaskManager
from shared.models.file_models import FileInfo
from shared.permissions import IsMicroserviceApiKeyPresent
from workspace_manager.models.smart_detect_models import SmartDetect, SmartDetectOutput
from workspace_manager.permissions import HasCreateSmartDetectPermission
from workspace_manager.serializers import SmartDetectSerializer
from workspace_manager.serializers.smart_detect_serializer import (
    SmartDetectAnalyticsStatusSerializer,
    UploadSmartDetectShapefileSerializer,
)


class SmartDetectViewSet(viewsets.ViewSet):
    permission_classes = [HasCreateSmartDetectPermission, IsFeatureFlagEnabled]

    def create(self, request):
        context = {
            "created_by": request.user,
        }
        smart_detect_serializer = SmartDetectSerializer(
            data=request.data, context=context
        )
        smart_detect_serializer.is_valid(raise_exception=True)
        smart_detect_serializer.validated_data

        self.check_object_permissions(
            self.request, smart_detect_serializer.validated_data.get("iteration")
        )
        smart_detect = smart_detect_serializer.save()
        return Response(
            {
                "message": "Smart detect batch job created",
                "data": {"smart_detect": smart_detect.id},
            },
            status=status.HTTP_202_ACCEPTED,
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsMicroserviceApiKeyPresent],
    )
    def outputs(self, request, pk=None):
        smart_detect = get_object_or_404(SmartDetect, pk=pk)
        serializer = UploadSmartDetectShapefileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shape_file: InMemoryUploadedFile = serializer.validated_data.get("shape_file")
        smart_detect_layer = serializer.validated_data.get("layer_id")

        if not SmartDetectOutput.objects.filter(
            smart_detect=smart_detect, layers__in=[smart_detect_layer]
        ).exists():
            raise Exception("Smart detect output does not exist")

        shapefile_temp_dir = tempfile.TemporaryDirectory()

        with zipfile.ZipFile(shape_file, "r") as zip_file:
            zip_file.extractall(shapefile_temp_dir.name)

        # Close the InMemoryUploadedFile to release memory.
        shape_file.close()

        background_task_manager = BackgroundTaskManager()

        # Executing concurrent tasks.
        background_task_manager.submit_task(
            insert_bulk_features,
            shapefile_temp_dir,
            smart_detect_layer,
            None,
        )

        response = {
            "message": "Shapefile added successfully.",
            "data": {},
        }

        return Response(response, status=status.HTTP_202_ACCEPTED)

    @action(
        detail=True,
        methods=["patch"],
        url_path="status",
        permission_classes=[IsMicroserviceApiKeyPresent],
    )
    def status(self, request, pk=None):
        data = request.data
        serializer = SmartDetectAnalyticsStatusSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        layer_file_status = serializer.validated_data["status"]

        smart_detect = SmartDetect.objects.filter(id=pk).first()
        if not smart_detect:
            return Response(
                {"message": "Smart Detect object not found", "data": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        smart_detect_outputs = smart_detect.get_outputs()
        layer_ids = Layer.objects.filter(
            smart_detect_layers__in=smart_detect_outputs
        ).values_list("id", flat=True)

        file_info_ids = LayerFile.objects.filter(layer_id__in=layer_ids).values_list(
            "file_info_id", flat=True
        )
        if len(file_info_ids) == 0:
            return Response(
                {"message": "Smart Detect output layer file not found", "data": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        FileInfo.objects.filter(id__in=file_info_ids).update(status=layer_file_status)
        response = {
            "message": f"Smart Detect Output layers' status updated successfully to {layer_file_status}",
            "data": {},
        }
        return Response(response)
