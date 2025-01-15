import tempfile
import zipfile

from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db.models import Prefetch
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from iteration_manager.models import Iteration
from org_manager.feature_flags import FeatureFlag
from org_manager.permissions import is_feature_flag_enabled
from org_manager.validators import is_object_in_same_org
from rainbow import logger
from shared.background_task import BackgroundTaskManager
from shared.constants import BatchJobStatus, FileType
from shared.exception_handling import ApiErrors, GeneralException, ValidationErrors
from shared.helpers import filter_dynamic_fields, get_object_with_uuid, paginate_data
from shared.permissions import IsMicroserviceApiKeyPresent
from site_manager.models import SitePermission
from user_manager.permissions import IsOrgAdmin

from ..constants import ClampToTerrainStatus, LayerType
from ..helpers import (
    insert_bulk_features,
    prepare_vector_files_for_download,
    send_features_to_clamp,
)
from ..models import Feature, Layer, LayerFile
from ..permissions import (
    HasCreateLayerPermission,
    HasGetLayersPermission,
    HasListLayersPermission,
    HasManageIterationLayersPermission,
    can_manage_layers,
)
from ..serializers import (
    ClampToTerrainStatusSerializer,
    CreateLayerSerializer,
    GenerateContourSerializer,
    GenerateSlopeMapSerializer,
    LayerListSerializer,
    LayerSerializer,
    UpdateLayerFileStatusSerializer,
    UpdateLayerPropertiesSerializer,
)


class LayerViewSet(viewsets.ViewSet):
    serializer_class = LayerSerializer
    permission_classes = (HasManageIterationLayersPermission,)

    def get_permissions(self):
        if self.action == "list":
            self.permission_classes = (HasListLayersPermission,)
        elif self.action == "retrieve":
            self.permission_classes = (HasGetLayersPermission,)
        elif self.action == "create":
            self.permission_classes = (HasCreateLayerPermission,)
        elif self.action == "destroy":
            self.permission_classes = (IsOrgAdmin,)
        return super().get_permissions()

    def get_queryset(self, iteration_id):
        queryset = Layer.objects.get_layers_for_user(self.request.user, iteration_id)
        return filter_dynamic_fields(queryset, self.request.query_params)

    def get_object(self, pk):
        org_layers = Layer.objects.get_layers_for_org(self.request.user.org)
        layer = get_object_with_uuid(org_layers, id=pk)
        self.check_object_permissions(self.request, layer)
        return layer

    # CRUD Endpoints.
    def list(self, request):
        if iteration_id := request.GET.get("iteration_id"):
            layers = self.get_queryset(iteration_id)
        else:
            raise ValidationError(ApiErrors.ITERATION_ID_NOT_FOUND.value)

        if iteration_id:
            layers = layers.filter(iteration_id=iteration_id)
        if layer_type := request.GET.get("type"):
            layers = layers.filter(type=layer_type)
        if search_param := self.request.query_params.get("search"):
            layers = layers.filter(name__icontains=search_param)

        # Latest layers should show up on top.
        layers = layers.prefetch_related(
            Prefetch(
                "layer_files",
                LayerFile.objects.filter(file_info__is_folder=False),
                to_attr="files",
            ),
            Prefetch(
                "layer_files",
                LayerFile.objects.filter(file_info__type=FileType.VECTOR_TILES.value),
                to_attr="vector_tiles",
            ),
        ).order_by("-created_at")

        # Only list layers if iteration_id is provided & found.
        iteration = get_object_with_uuid(Iteration, id=iteration_id)

        if not is_object_in_same_org(request, iteration):
            raise PermissionDenied()

        # Pagination and requested layer handling.
        page_number = request.GET.get("page")
        page_size = request.GET.get("page_size")

        if requested_layer_id := request.GET.get("requested_layer_id"):
            requested_layer = get_object_with_uuid(layers, id=requested_layer_id)

            # Find the number of layers that are preceeding to the requested layer.
            num_preceeding_layers = layers.filter(
                created_at__gt=requested_layer.created_at
            ).count()

            # Depending upon the page size and preceeding layer, calculate the page number where the layer exsits.
            page_number = num_preceeding_layers // int(page_size) + 1

        paginated_data, total_count = paginate_data(page_number, page_size, layers)

        include_fields = self.request.query_params.get("include_fields")
        exclude_fields = self.request.query_params.get("exclude_fields")

        serializer = LayerListSerializer(
            paginated_data,
            many=True,
            include_fields=include_fields,
            exclude_fields=exclude_fields,
        )
        if iteration.captured_dsm_cog and iteration.captured_dsm_cog.batch_job:
            has_dsm = (
                iteration.captured_dsm_cog.batch_job.status
                == BatchJobStatus.COMPLETED.value
            )
        else:
            has_dsm = False

        response_data = {
            "layers": serializer.data,
            "iteration_name": iteration.name,
            "site_id": iteration.site_id,
            "can_manage_layers": can_manage_layers(request.user, iteration)
            or request.user.is_org_admin,
            "access_type": SitePermission.objects.get_access_type(
                request.user, iteration.site
            ),
            "total": total_count,
            "has_dsm": has_dsm,
            "page_number": page_number,
            "requested_layer_id": requested_layer.id if requested_layer_id else None,
        }
        response = {
            "message": "Layers fetched successfully.",
            "data": response_data,
        }
        return Response(response)

    def create(self, request):
        data = request.data.copy()
        iteration = get_object_with_uuid(Iteration, id=data.get("iteration"))
        data["site"] = iteration.site_id
        serializer = CreateLayerSerializer(
            data=data, context={"logged_user": request.user}
        )

        if serializer.initial_data["type"] == LayerType.MBTILES.value:
            is_feature_flag_enabled(request.user.org, FeatureFlag.MBTILES)

        serializer.is_valid(raise_exception=True)

        layer: Layer = serializer.save()

        features_file: InMemoryUploadedFile = serializer.validated_data.get(
            "features_file"
        )

        if features_file and layer.type == LayerType.VECTOR.value:
            # Saving the file in temporary directory.
            shapefile_temp_dir = tempfile.TemporaryDirectory()

            # Extracting zip file in temp directory.
            with zipfile.ZipFile(features_file, "r") as zip_file:
                zip_file.extractall(shapefile_temp_dir.name)

            # Close the InMemoryUploadedFile to release memory.
            features_file.close()

            background_task_manager = BackgroundTaskManager()

            # Executing concurrent tasks.
            background_task_manager.submit_task(
                insert_bulk_features,
                shapefile_temp_dir,
                layer,
                serializer.validated_data.get("clamp_to_terrain"),
            )

        response = {
            "message": f"{serializer.data['name']} added successfully to Layers.",
            "data": serializer.data,
        }

        return Response(response, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        layer: Layer = self.get_object(pk)

        serializer = self.serializer_class(layer)
        response = {
            "message": "Layer fetched successfully",
            "data": serializer.data,
        }
        return Response(response)

    def partial_update(self, request, pk=None):
        layer = self.get_object(pk)
        data = request.data.copy()
        serializer = self.serializer_class(
            layer,
            data=data,
            partial=True,
            context={"logged_user": request.user},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": "Layer updated successfully.",
            "data": serializer.data,
        }
        return Response(response)

    def destroy(self, request, pk=None):
        layer = self.get_object(pk)
        layer.delete()

        # TODO: Replace the code with the new implementation for delete response.
        return HttpResponse(status=status.HTTP_204_NO_CONTENT)

    # Export layer endpoints.
    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsMicroserviceApiKeyPresent | HasGetLayersPermission],
    )
    def download(self, request, pk=None):
        layer = get_object_with_uuid(Layer, id=pk)
        self.check_object_permissions(self.request, layer)

        response_format = request.query_params.get("response_format")

        if layer.type != LayerType.VECTOR.value:
            raise ValidationError(
                ValidationErrors.ONLY_VECTOR_LAYER_CAN_BE_DOWNLOADED.value
            )

        vector_file = prepare_vector_files_for_download(layer, response_format)

        response = HttpResponse(
            vector_file["file"],
            content_type=vector_file["content_type"],
        )
        response[
            "Content-Disposition"
        ] = f"attachment; filename={vector_file['filename']}"

        return response

    @action(
        detail=True,
        methods=["patch"],
        url_path="properties",
        permission_classes=[AllowAny],
        serializer_class=UpdateLayerPropertiesSerializer,
    )
    def properties(self, request, pk=None):
        layer = get_object_with_uuid(Layer, pk)
        serializer = self.serializer_class(layer, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response = {
            "message": "Layer properties updated successfully.",
            "data": {"id": layer.id, "properties": layer.properties},
        }
        return Response(response)

    # Layer generator endpoints.
    @action(
        detail=False,
        methods=["post"],
        url_path="generate-contour",
        serializer_class=GenerateContourSerializer,
        permission_classes=[IsAuthenticated],
    )
    def generate_contour(self, request, pk=None):
        serializer = self.serializer_class(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": "Contour generation initiated.",
            "data": serializer.data,
        }
        return Response(response, status=status.HTTP_202_ACCEPTED)

    @action(
        detail=False,
        methods=["post"],
        url_path="generate-slope-map",
        serializer_class=GenerateSlopeMapSerializer,
        permission_classes=[IsAuthenticated],
    )
    def generate_slope_map(self, request, pk=None):
        serializer = self.serializer_class(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response = {
            "message": "Slope map generation initiated.",
            "data": serializer.data,
        }
        return Response(response, status=status.HTTP_202_ACCEPTED)

    @action(
        detail=True,
        methods=["post"],
        url_path="clamp-to-terrain",
        permission_classes=[IsAuthenticated],
    )
    def clamp_to_terrain(self, request, pk=None):
        layer: Layer = get_object_with_uuid(Layer, id=pk)
        captured_dsm_cog = layer.iteration.captured_dsm_cog

        if not Feature.objects.filter(layer_id=layer.id).exists():
            raise GeneralException(ApiErrors.NO_FEATURE_PRESENT_FOR_CLAMPING.value)

        if captured_dsm_cog is not None:
            layer.clamped_status = ClampToTerrainStatus.STARTED.value
            send_features_to_clamp(layer.id, captured_dsm_cog.s3_key)
            layer.save(update_fields=["clamped_status"])
        else:
            logger.error(ApiErrors.DSM_COG_NOT_FOUND.value.message)
            raise GeneralException(ApiErrors.DSM_NOT_FOUND.value)

        return Response(
            {"message": "Clamp to Terrain initiated"},
            status=status.HTTP_202_ACCEPTED,
        )

    @action(
        detail=True,
        methods=["patch"],
        url_path="clamp-to-terrain/status",
        permission_classes=[AllowAny],
    )
    def clamp_to_terrain_status(self, request, pk=None):
        layer = get_object_with_uuid(Layer, id=pk)
        serializer = ClampToTerrainStatusSerializer(layer, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {
                "message": f"Layer clamp to terrain status updated to {serializer.data.get('status')} successfully",
                "data": serializer.data,
            }
        )

    # TODO: Add test and OpenAPI doc for this endpoint.
    @action(
        detail=True,
        methods=["patch"],
        url_path="file-status",
        permission_classes=[IsMicroserviceApiKeyPresent],
    )
    def file_status(self, request, pk=None):
        layer = get_object_or_404(Layer.objects.prefetch_related("layer_files"), id=pk)
        layer_file = layer.layer_files.first()
        if not layer_file:
            return Response(
                {"message": "No Layer file associated with layer", "data": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = UpdateLayerFileStatusSerializer(
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)

        layer_file_status = serializer.validated_data.get("status")
        errors = serializer.validated_data.get("errors")

        file_info = layer_file.file_info
        file_info.status = layer_file_status
        file_info.errors = errors if errors else []
        file_info.save()

        return Response(
            {
                "message": f"Layer file status updated to {serializer.data.get('status')} successfully",
                "data": serializer.data,
            }
        )
