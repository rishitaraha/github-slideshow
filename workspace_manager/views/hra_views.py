import csv
import tempfile
import zipfile
from io import StringIO

from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db.models import Prefetch
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status as http_status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from analytics_engine_manager.operations import (
    ExecuteHRAPayloadSchema,
    HRAWorkflow,
    execute_hra,
)
from layer_manager.constants import FeatureType
from layer_manager.helpers import insert_bulk_features
from layer_manager.models import Feature, Layer, LayerFile
from org_manager.helpers import get_current_org
from org_manager.permissions import IsFeatureFlagEnabled
from shared.background_task import BackgroundTaskManager
from shared.constants import FileError, Status
from shared.helpers import get_object_with_uuid
from shared.models.file_models import FileInfo
from shared.permissions import IsMicroserviceApiKeyPresent
from workspace_manager.serializers.hra_serializers import (
    HaulRoadAnalyticsLayerStatusSerializer,
)

from ..models import HaulRoad, HaulRoadLayer, HaulRoadType
from ..permissions import (
    HaulRoadAnalyticsCreatePermission,
    HaulRoadAnalyticsGetPermission,
    HaulRoadAnalyticsListPermission,
)
from ..serializers import (
    HaulRoadAnalyticsDetailsSerializer,
    HaulRoadAnalyticsListQueryParams,
    HaulRoadAnalyticsSerializer,
    HaulRoadAnalyticsStatusSerializer,
    HaulRoadTypesSerializer,
    UploadShapefileSerializer,
)


class HaulRoadAnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [HaulRoadAnalyticsGetPermission, IsFeatureFlagEnabled]
    serializer_class = HaulRoadAnalyticsSerializer

    def get_object(self, pk) -> HaulRoad:
        haul_road = get_object_with_uuid(HaulRoad, id=pk)
        self.check_object_permissions(self.request, haul_road)
        return haul_road

    def get_permissions(self):
        if self.action == "list":
            self.permission_classes = [
                HaulRoadAnalyticsListPermission,
                IsFeatureFlagEnabled,
            ]
        elif self.action == "create":
            self.permission_classes = [
                HaulRoadAnalyticsCreatePermission,
                IsFeatureFlagEnabled,
            ]
        return super().get_permissions()

    def list(self, request):
        haul_road_list_serializer = HaulRoadAnalyticsListQueryParams(data=request.GET)
        haul_road_list_serializer.is_valid(raise_exception=True)
        validated_query_param = haul_road_list_serializer.validated_data
        haul_roads = HaulRoad.objects.filter(
            iteration=validated_query_param.get("iteration")
        )
        response_serializer = self.serializer_class(haul_roads, many=True)
        return Response(
            {
                "message": "Haul roads fetched successfully",
                "data": response_serializer.data,
            }
        )

    def create(self, request):
        serializer = self.serializer_class(
            data=request.data, context={"created_by": request.user}
        )
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        haul_road: HaulRoad = serializer.save()

        # Batch job execution for HRA.
        hra_payload: ExecuteHRAPayloadSchema = {
            "haul_road_name": validated_data["name"],
            "haul_road_id": serializer.data["id"],
            "input_dtm_path": validated_data["iteration"].captured_dsm.s3_uri,
            "chainage_distance": validated_data["chainage_interval"],
            "vehicle_width": validated_data["vehicle_width"],
        }

        if edge_layer := validated_data.get("edge_layer"):
            hra_payload["input_linestring_wkt"] = ",".join(
                [
                    feature.get_2d_geometry_wkt()
                    for feature in Feature.objects.filter(
                        layer=edge_layer, type=FeatureType.LINE_STRING.value
                    )
                ]
            )
            hra_payload["workflow"] = HRAWorkflow.HRA_FROM_INPUT_EDGES.value

            if medians_layer := validated_data.get("medians_layer"):
                hra_payload["input_medians_layer_id"] = medians_layer.id

        elif center_line_layer := validated_data.get("center_line_layer"):
            hra_payload["input_linestring_wkt"] = (
                Feature.objects.filter(
                    layer=center_line_layer, type=FeatureType.LINE_STRING.value
                )
                .first()
                .get_2d_geometry_wkt()
            )

            hra_payload["workflow"] = HRAWorkflow.HRD_FROM_CENTER_LINE.value

        else:
            hra_payload["input_linestring_wkt"] = validated_data["smart_line_wkt"]
            hra_payload["workflow"] = HRAWorkflow.HRD_FROM_SMART_LINE.value

        haul_road.batch_job = execute_hra(hra_payload)
        haul_road.save(update_fields=["batch_job"])

        return Response(
            {
                "message": "Haul road created successfully",
                "data": serializer.data,
            },
            status=http_status.HTTP_201_CREATED,
        )

    def retrieve(self, request, pk=None):
        haul_road = (
            HaulRoad.objects.filter(id=pk)
            .prefetch_related(Prefetch("haulroadlayer_set", to_attr="haul_road_layers"))
            .first()
        )
        if not haul_road:
            return Response(status=http_status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, haul_road)

        serializer = HaulRoadAnalyticsDetailsSerializer(haul_road)
        response = {
            "message": "Haul Road details fetched successfully",
            "data": serializer.data,
        }
        return Response(response)

    def destroy(self, request, pk=None):
        haul_road = self.get_object(pk)

        # FIXME: Cascade delete is not working when deleting haul road.
        haul_road_layers = HaulRoadLayer.objects.filter(haul_road=haul_road)
        layers = Layer.objects.filter(id__in=haul_road_layers.values_list("layer_id"))

        layers.delete()
        haul_road_layers.delete()
        haul_road.delete()

        return Response(status=http_status.HTTP_204_NO_CONTENT)

    @action(
        detail=True,
        methods=["post"],
        url_path="layer",
        permission_classes=[IsMicroserviceApiKeyPresent],
    )
    def upload(self, request, pk=None):
        haul_road = get_object_or_404(HaulRoad, pk=pk)
        self.check_object_permissions(request, haul_road)
        serializer = UploadShapefileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        haul_road_layer_type = serializer.validated_data.get("type")
        shape_file: InMemoryUploadedFile = serializer.validated_data.get("shape_file")

        haul_road_layer = HaulRoadLayer.objects.filter(
            haul_road=haul_road, type=haul_road_layer_type
        ).first()

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
            haul_road_layer.layer,
            None,
        )

        response = {
            "message": "Shapefile added successfully.",
            "data": {},
        }

        return Response(response, status=http_status.HTTP_202_ACCEPTED)

    # TODO: Add test and OpenAPI doc for this endpoint.
    @action(
        detail=True,
        methods=["patch"],
        url_path="status",
        permission_classes=[IsMicroserviceApiKeyPresent],
    )
    def status(self, request, pk=None):
        data = request.data
        serializer = HaulRoadAnalyticsStatusSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        status: Status = serializer.data["status"]

        FileInfo.objects.filter(
            id__in=LayerFile.objects.filter(
                layer__haulroadlayer__haul_road_id=pk
            ).values_list("file_info", flat=True)
        ).update(status=status, errors=[FileError.FAILED_TO_GENERATE_OUTPUT.name])

        response = {
            "message": f"Haul Road layers' status updated successfully to {status}",
            "data": {},
        }

        return Response(response, status=http_status.HTTP_200_OK)

    # TODO: Add test and OpenAPI doc for this endpoint.
    @action(
        detail=True,
        methods=["patch"],
        url_path="layer-status",
        permission_classes=[IsMicroserviceApiKeyPresent],
    )
    def haul_road_layer_status(self, request, pk=None):
        data = request.data
        serializer = HaulRoadAnalyticsLayerStatusSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        status = serializer.data["status"]
        errors = serializer.data["errors"]
        type = serializer.data["type"]

        layer_file = LayerFile.objects.filter(
            layer__haulroadlayer__haul_road_id=pk,
            layer__haulroadlayer__type=type,
        ).first()

        if not layer_file:
            raise NotFound(
                f"No FileInfo found for Haul Road Layer with type '{type}' and haul_road_id '{pk}'."
            )

        file_info = layer_file.file_info
        file_info.status = status
        file_info.errors = errors if errors else []
        file_info.save()

        response = {
            "message": f"Haul Road layer status of {type} updated successfully to {status}",
            "data": {},
        }

        return Response(response, status=http_status.HTTP_200_OK)

    @action(
        detail=False,
        methods=["get"],
        url_path="types",
        permission_classes=[IsAuthenticated, IsFeatureFlagEnabled],
    )
    def types(self, request):
        current_org = get_current_org(request)
        haul_road_types = HaulRoadType.objects.filter(org=current_org.id)
        serializer = HaulRoadTypesSerializer(haul_road_types, many=True)
        response = {
            "message": "Haul road types fetched successfully",
            "data": serializer.data,
        }
        return Response(response, status=http_status.HTTP_200_OK)

    # TODO: Add test for this endpoint.
    @action(detail=True, methods=["get"])
    def attributes(self, request, pk=None):
        haul_road = self.get_object(pk)

        response = {
            "message": "Haul road attributes fetched successfully.",
            "data": haul_road.get_attributes(),
        }
        return Response(response, status=http_status.HTTP_200_OK)

    # TODO: Add test for this endpoint.
    @action(
        detail=True,
        methods=["get"],
        url_path="attributes/download",
    )
    def download_attributes(self, request, pk=None):
        haul_road = self.get_object(pk)
        haul_road_attributes = haul_road.get_attributes()

        csv_column_names = [
            "PATCH INTERVALS",
            "SEGMENT NAME",
            "CHAINAGE (m)",
            "START ELEVATION (m)",
            "END ELEVATION (m)",
            "GRADIENT ANGLE (°)",
            "GRADIENT RATIO (1:X)",
            "GRADIENT RISK CLASSIFICATION",
            "WIDTH (m)",
            "WIDTH RISK CLASSIFICATION",
        ]
        csv_file = StringIO()

        # Create CSV writer object.
        writer = csv.writer(csv_file)
        writer.writerow(csv_column_names)

        for attribute in haul_road_attributes:
            gradient_x = attribute.get("gradient_x")
            gradient_ratio = f"1:{gradient_x}" if gradient_x else None
            writer.writerow(
                [
                    attribute.get("patch_name"),
                    attribute["chain_name"],
                    attribute.get("chain_dist"),
                    attribute.get("start_elev"),
                    attribute.get("end_elev"),
                    attribute.get("gradient"),
                    gradient_ratio,
                    attribute.get("gradient_risk_category"),
                    attribute["chainwidth"],
                    attribute["width_risk_category"],
                ]
            )

        filename = f"{haul_road.name}_haul_road_report.csv"
        response = HttpResponse(csv_file.getvalue(), content_type="application/csv")
        response["Content-Disposition"] = f"attachment; filename={filename};"

        return response
