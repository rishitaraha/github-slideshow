import json

from django.http import HttpResponse
from rest_framework import exceptions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from shapely import geometry, wkt

from analytics_engine_manager.operations import (
    delete_file_from_analytics_engine_efs,
    generate_3d_shape_file,
    get_elevation_profile,
)
from org_manager.helpers import get_current_org
from org_manager.permissions import HasOrgAccessToken, IsFeatureFlagEnabled
from org_manager.validators import validate_org_ownership
from rainbow.env_variables import EnvVariable
from shared.constants import BatchJobStatus, FileStatus, FileType
from shared.exception_handling import (
    ApiErrors,
    DSMNotFoundException,
    FileUploadFailedException,
    ValidationErrors,
)
from shared.helpers import (
    complete_multipart_upload,
    create_s3_file_key,
    delete_file_from_s3,
    filter_dynamic_fields,
    get_altitude_from_dsm_cog,
    get_cog_metadata,
    get_object_with_uuid,
    get_presigned_url,
    paginate_data,
    send_email,
    start_uploading_file,
)
from shared.serializers import (
    FileUploadCompleteSerializer,
    FileUploadSerializer,
    GetPresignedUrlSerializer,
    UpdateBatchJobStatusSerializer,
    UpdateFileStatusSerializer,
)
from site_manager.models import Site, SitePermission
from templates import EmailTemplatePath
from user_manager.permissions import IsOrgAdmin

from ..models import Iteration
from ..permissions import (
    HasCreateIterationPermission,
    HasGetIterationPermission,
    HasListIterationsPermission,
    HasManageIterationsPermission,
    can_manage_iterations,
    can_manage_iterations_or_403,
    can_view_iterations_or_403,
)
from ..serializers import (
    AltitudeQueryParamsSerializer,
    CheckTerrainTilePermissionSerializer,
    DownloadElevationProfileQueryParamSerializer,
    EditIterationSerializer,
    ElevationProfileSerializer,
    GenerateAnalyticsSerializer,
    IterationSerializer,
    IterationsQueryParamsSerializer,
    RetrieveIterationSerializer,
    SubtractDsmSerializer,
)


class IterationViewSet(viewsets.ViewSet):
    serializer_class = IterationSerializer
    permission_classes = (HasManageIterationsPermission,)

    def get_permissions(self):
        if self.action == "list":
            self.permission_classes = (HasListIterationsPermission | HasOrgAccessToken,)
        elif self.action == "create":
            self.permission_classes = (HasCreateIterationPermission,)
        elif self.action == "destroy":
            self.permission_classes = (IsOrgAdmin,)
        return super().get_permissions()

    def get_queryset(self):
        org = get_current_org(self.request)
        iterations = Iteration.objects.filter(site__project__org=org)
        return filter_dynamic_fields(iterations, self.request.query_params)

    def get_object(self, pk) -> Iteration:
        iteration = get_object_with_uuid(self.get_queryset(), id=pk)
        self.check_object_permissions(self.request, iteration)
        return iteration

    def list(self, request):
        # Validate query parameters using the serializer.
        query_param_serializer = IterationsQueryParamsSerializer(
            data=request.query_params
        )
        query_param_serializer.is_valid(raise_exception=True)

        # Extract validated data.
        validated_query_params = query_param_serializer.validated_data
        site_id = validated_query_params.get("site_id")
        search_query = validated_query_params.get("search")
        page_number = validated_query_params.get("page")
        page_size = validated_query_params.get("page_size")
        include_fields = validated_query_params.get("include_fields")
        exclude_fields = validated_query_params.get("exclude_fields")

        iterations = (
            self.get_queryset()
            .filter(site_id=site_id)
            .order_by("-date", "name", "-created_at")
        )

        if search_query:
            iterations = iterations.filter(name__icontains=search_query)
        iterations, total_count = paginate_data(page_number, page_size, iterations)

        site = get_object_with_uuid(Site, id=str(site_id))
        serializer = self.serializer_class(
            iterations,
            many=True,
            include_fields=include_fields,
            exclude_fields=exclude_fields,
        )

        # Check user manage iteration permission.
        has_manage_iterations_permission = False
        if request.user.is_authenticated:
            has_manage_iterations_permission = can_manage_iterations(request.user, site)

        response_data = {
            "iterations": serializer.data,
            "site_name": site.name,
            "project_id": site.project_id,
            "can_manage_iterations": has_manage_iterations_permission,
            "access_type": SitePermission.objects.get_access_type(request.user, site),
            "total": total_count,
        }
        response = {
            "message": "Iterations fetched successfully.",
            "data": response_data,
        }
        return Response(response)

    def create(self, request):
        data = request.data
        serializer = self.serializer_class(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": "Iteration created successfully.",
            "data": serializer.data,
        }
        return Response(response, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        iteration = self.get_object(pk)
        exclude_fields = request.query_params.get("exclude_fields")
        include_fields = request.query_params.get("include_fields")
        serializer = RetrieveIterationSerializer(
            iteration,
            exclude_fields=exclude_fields,
            include_fields=include_fields,
        )

        response_data = serializer.data.copy()
        response = {
            "message": "Iteration fetched successfully.",
            "data": response_data,
        }
        return Response(response)

    def partial_update(self, request, pk=None):
        data = request.data.copy()
        iteration = self.get_object(pk)
        serializer = EditIterationSerializer(iteration, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": "Iteration updated successfully.",
            "data": serializer.data,
        }
        return Response(response)

    def destroy(self, request, pk=None):
        iteration = self.get_object(pk)
        iteration.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="upload-file")
    def upload_file(self, request, pk=None):
        iteration = self.get_object(pk)
        serializer = FileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        filename = serializer.data.get("filename")
        filetype = serializer.data.get("filetype")

        key = create_s3_file_key(filetype, f"{str(iteration.id)}.tif")
        upload_id = None

        if filetype == FileType.CAPTURED_DSM.value:
            captured_dsm, upload_id = start_uploading_file(
                key=key,
                filename=filename,
                filetype=filetype,
            )
            iteration.captured_dsm = captured_dsm
            iteration.save(update_fields=["captured_dsm"])

        response = {
            "message": f"{filetype} upload_id generated for {iteration.name}",
            "data": {
                "iteration": iteration.id,
                "upload_id": upload_id,
            },
        }
        return Response(response)

    @action(detail=True, methods=["post"], url_path="presigned-url")
    def presigned_url(self, request, pk=None):
        iteration = self.get_object(pk)
        serializer = GetPresignedUrlSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        upload_id = serializer.data.get("upload_id")
        part_number = serializer.data.get("part_number")
        filetype = serializer.data.get("filetype")
        signed_url = None
        if filetype == FileType.CAPTURED_DSM.value:
            signed_url = get_presigned_url(
                iteration.captured_dsm.bucket_name,
                iteration.captured_dsm.s3_key,
                upload_id,
                part_number,
            )

        else:
            raise exceptions.UnsupportedMediaType(
                ValidationErrors.INVALID_FILE_TYPE.value
            )

        response = {
            "message": f"Presigned url generated for {iteration.name}",
            "data": {"iteration": iteration.id, "url": signed_url},
        }

        return Response(response)

    @action(detail=True, methods=["post"], url_path="complete-upload")
    def complete_upload(self, request, pk=None):
        iteration = self.get_object(pk)
        serializer = FileUploadCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        upload_id = serializer.data.get("upload_id")
        parts = serializer.data.get("parts")
        filetype = serializer.data.get("filetype")
        uploaded = False
        if filetype == FileType.CAPTURED_DSM.value:
            uploaded = complete_multipart_upload(
                iteration.captured_dsm, parts, upload_id
            )

        else:
            raise exceptions.UnsupportedMediaType(
                ValidationErrors.INVALID_FILE_TYPE.value
            )

        if not uploaded:
            raise FileUploadFailedException(ApiErrors.CAPTURE_DSM_UPLOAD_FAILED.value)

        response = {
            "message": "CapturedDSM file upload completed",
            "data": {"iteration": iteration.id},
        }
        return Response(response)

    @action(detail=True, methods=["delete"], url_path="captured-dsm")
    def captured_dsm(self, request, pk=None):
        iteration: Iteration = self.get_object(pk)
        if is_captured_dsm_deleted := delete_file_from_s3(iteration.captured_dsm):
            delete_file_from_analytics_engine_efs(iteration.captured_dsm.s3_key)

            # Deleting cog file of that dsm.
            if captured_dsm_cog_file_info := iteration.captured_dsm_cog:
                if is_captured_dsm_cog_deleted := delete_file_from_s3(
                    captured_dsm_cog_file_info
                ):
                    iteration.captured_dsm_cog = None
                    iteration.save(update_fields=["captured_dsm_cog"])
                    captured_dsm_cog_file_info.delete()

            # Deleting terrain tiles of that dsm.
            if terrain_tiles_batch_job := iteration.terrain_tiles:
                # TODO: Delete terrain tile files from s3.
                iteration.terrain_tiles = None
                iteration.save(update_fields=["terrain_tiles"])
                terrain_tiles_batch_job.delete()

            return Response(
                {"message": f"Captured DSM of {iteration.name} is deleted."}
            )
        return exceptions.server_error(request)

    @action(
        detail=True,
        methods=["get"],
        url_path="(?P<filetype>[^/.]+)/metadata",
        permission_classes=[HasGetIterationPermission | HasOrgAccessToken],
    )
    def metadata(self, request, filetype, pk=None):
        iteration: Iteration = self.get_object(pk)

        metadata = None
        if (
            filetype == FileType.CAPTURED_DSM.value
            and iteration.captured_dsm_cog
            and iteration.captured_dsm_cog.batch_job.status
            == BatchJobStatus.COMPLETED.value
        ):
            captured_dsm_fileinfo_object = iteration.captured_dsm_cog
            metadata = get_cog_metadata(
                f"{EnvVariable.BUCKET_NAME.value}/{captured_dsm_fileinfo_object.s3_key}"
            )

        else:
            raise NotFound()

        response = {
            "message": f"Metadata for {filetype} fetched successfully.",
            "data": metadata,
        }
        return Response(response)

    # Remove after DSM as a layer.
    @action(
        detail=True,
        methods=["patch"],
        url_path="batch-status/(?P<filetype>[^/.]+)",
        permission_classes=[AllowAny],
    )
    def batch_status(self, request, filetype, pk=None):
        iteration = get_object_with_uuid(Iteration, id=pk)
        data = request.data.copy()

        # Temporary fix to make DSM COG status update compatible with
        # Ortho as a layer.
        if (
            filetype == FileType.CAPTURED_DSM_COG.value
            and data.get("status") == FileStatus.DONE.value
        ):
            data["status"] = BatchJobStatus.COMPLETED.value

        serializer = UpdateBatchJobStatusSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        status = serializer.data.get("status")

        if filetype == FileType.TERRAIN_TILES.value:
            batch_job = iteration.terrain_tiles

        elif filetype == FileType.CAPTURED_DSM_COG.value and iteration.captured_dsm_cog:
            batch_job = iteration.captured_dsm_cog.batch_job

        else:
            raise exceptions.UnsupportedMediaType(
                ValidationErrors.INVALID_FILE_TYPE.value
            )

        if not batch_job:
            raise exceptions.NotFound()

        batch_job.status = status
        batch_job.save(update_fields=["status"])

        response = {
            "message": f"{filetype} status updated of iteration {iteration.name}",
            "data": {"iteration": iteration.id, "status": status},
        }
        return Response(response)

    @action(
        detail=True,
        methods=["patch"],
        url_path="file-status/(?P<filetype>[^/.]+)",
        permission_classes=[AllowAny],
        serializer_class=UpdateFileStatusSerializer,
    )
    def file_status(self, request, filetype, pk=None):
        iteration: Iteration = get_object_with_uuid(Iteration, id=pk)
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        status = serializer.data.get("status")

        if filetype != FileType.CAPTURED_DSM.value:
            raise exceptions.UnsupportedMediaType(
                ValidationErrors.INVALID_FILE_TYPE.value
            )

        file_info = iteration.captured_dsm

        file_info.status = status
        file_info.save(update_fields=["status"])

        response = {
            "message": f"{filetype} status updated of iteration {iteration.name}",
            "data": {"iteration": iteration.id, "status": status},
        }
        return Response(response)

    # TODO: Move this endpoint to `workspace_manager` since it uses resources from both `layer_manager` and `iteration_manager`. It should ideally reside in either `layer_manager` or `workspace_manager`.
    @action(
        detail=False,
        methods=["post"],
        url_path="elevation-profile",
        permission_classes=[IsAuthenticated],
        serializer_class=ElevationProfileSerializer,
    )
    def elevation_profile(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.data

        iterations = self.get_queryset().filter(id__in=data["iterations"])
        iterations_with_dsm_key = []
        iterations_without_dsm = []

        if len(iterations) == 0:
            raise ValidationError(ApiErrors.INVALID_ITERATION_IDS.value)

        for iteration in iterations:
            # TODO: Optimize the code to make a single query that validates all iterations together, instead of querying each iteration individually.
            can_view_iterations_or_403(request.user, iteration.site)

            if not iteration.captured_dsm:
                iterations_without_dsm.append(iteration.name)
            else:
                iterations_with_dsm_key.append(
                    {
                        "id": str(iteration.id),
                        "dsm_s3_key": iteration.captured_dsm.s3_key,
                    }
                )
        if iterations_without_dsm:
            api_error_obj = ApiErrors.DSM_NOT_FOUND.value
            api_error_obj.message = (
                f"DSM not present for {', '.join(iterations_without_dsm)}"
            )
            raise DSMNotFoundException(api_error_obj)

        elevation_profile, status_code = get_elevation_profile(
            iterations_with_dsm_key, data["line_wkt"]
        )

        response = {
            "message": "Elevation profile calculated successfully.",
            "data": elevation_profile,
            "status_code": status_code,
        }
        return Response(response)

    @action(
        detail=False,
        methods=["get"],
        url_path="download-elevation-path",
        permission_classes=[IsAuthenticated],
        serializer_class=DownloadElevationProfileQueryParamSerializer,
    )
    def download_elevation_path(self, request):
        serializer = self.serializer_class(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.data

        iterations = self.get_queryset().filter(id__in=data["iterations"])

        dsm_s3_keys = []
        iterations_without_dsm = []

        for iteration in iterations:
            # TODO: Optimize the code to make a single query that validates all iterations together, instead of querying each iteration individually.
            can_view_iterations_or_403(request.user, iteration.site)

            if not iteration.captured_dsm:
                iterations_without_dsm.append(iteration.name)
            else:
                dsm_s3_keys.append(iteration.captured_dsm.s3_key)

        if iterations_without_dsm:
            api_error_obj = ApiErrors.DSM_NOT_FOUND.value
            api_error_obj.message = (
                f"DSM not present for {', '.join(iterations_without_dsm)}"
            )
            raise DSMNotFoundException(api_error_obj)

        shape_file = generate_3d_shape_file(
            dsm_s3_keys, data["line_wkt"], "elevation_path.shp"
        )

        response = HttpResponse(shape_file, content_type="application/zip")
        response["Content-Disposition"] = f"attachment; filename=elevation_path.zip;"
        return response

    @action(
        detail=False,
        methods=["post"],
        url_path="subtract-dsm",
        permission_classes=[IsAuthenticated],
        serializer_class=SubtractDsmSerializer,
    )
    def subtract_dsm(self, request):
        serializer = self.serializer_class(
            data=request.data, context={"user": request.user}
        )
        serializer.is_valid(raise_exception=True)

        first_iteration = serializer.validated_data["first_iteration"]
        second_iteration = serializer.validated_data["second_iteration"]
        ortho_layer = serializer.validated_data["ortho_layer"]

        # Checking if user has permission to manage iterations.
        can_manage_iterations_or_403(request.user, first_iteration.site)
        can_manage_iterations_or_403(request.user, second_iteration.site)

        # Validating ownership of iterations.
        # TOFIX: Validation errors handling
        is_owner_of_first_iteration = validate_org_ownership(request, first_iteration)
        if not is_owner_of_first_iteration:
            raise ValidationError(ValidationErrors.ITERATION_NOT_FOUND.value)

        is_owner_of_second_iteration = validate_org_ownership(request, second_iteration)
        if not is_owner_of_second_iteration:
            raise ValidationError(ValidationErrors.ITERATION_NOT_FOUND.value)

        is_owner_of_ortho_layer = validate_org_ownership(request, ortho_layer)
        if not is_owner_of_ortho_layer:
            raise ValidationError(ValidationErrors.LAYER_NOT_FOUND.value)

        serializer.save()

        response = {
            "message": "The new iteration has been created and the DSM subtraction process has begun.",
            "data": serializer.data,
        }
        return Response(response, status=status.HTTP_202_ACCEPTED)

    # TODO: Refactor this endpoint to check iteration permission.
    @action(
        detail=False,
        methods=["post"],
        url_path="check-terrain-tiles-permission",
        permission_classes=[IsAuthenticated],
        serializer_class=CheckTerrainTilePermissionSerializer,
    )
    def check_terrain_tiles_permission(self, request):
        serializer = self.serializer_class(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        iteration = get_object_with_uuid(
            Iteration, id=str(serializer.validated_data["iteration"])
        )

        validate_org_ownership(request, iteration, raise_exception=True)

        can_view_iterations_or_403(request.user, iteration.site)

        # Checking s3 key.
        terrain_tile_s3_key = iteration.terrain_tiles.get_env_variable(
            "OUTPUT_S3_KEY"
        ).get("value")

        if terrain_tile_s3_key != serializer.validated_data["s3_key"]:
            raise ValidationError(ValidationErrors.INVALID_S3_KEY.value)

        response = {
            "message": "You are authorized to view the iteration.",
        }
        return Response(response, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["post"],
        url_path="generate-analytics",
        permission_classes=[IsFeatureFlagEnabled, HasManageIterationsPermission],
        serializer_class=GenerateAnalyticsSerializer,
    )
    def generate_analytics(self, request, pk=None):
        iteration: Iteration = self.get_object(pk)
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        site = iteration.site
        subject = f"Generate analytics request for {iteration.name}"

        template_filename = EmailTemplatePath.ANALYTICS_REQUEST.value
        template_context = {
            "org_name": request.user.org.name,
            "project_name": site.project.name,
            "site_name": site.name,
            "iteration_name": iteration.name,
            "selected_outputs": serializer.data.get("selected_outputs"),
        }

        recipient_list = [EnvVariable.ANALYTICS_REQUEST_RECIPIENT_EMAIL.value]
        polygon_geometry_obj = wkt.loads(serializer.data.get("polygon_wkt"))
        geojson_dict = geometry.mapping(polygon_geometry_obj)
        geojson = json.dumps(geojson_dict)

        attachment = (
            "generate_analytics_polygon.geojson",
            geojson,
            "application/json",
        )

        send_email(
            subject,
            recipient_list,
            template_context,
            template_filename,
            attachment=attachment,
        )

        response = {"message": "Generate analytics request sent successfully."}
        return Response(response, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=["get"],
        url_path="altitude",
        permission_classes=[IsAuthenticated],
        serializer_class=AltitudeQueryParamsSerializer,
    )
    def altitude(self, request):
        serializer = self.serializer_class(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        iteration_ids: list[str] = serializer.validated_data["iterations"]
        latitude = serializer.validated_data["latitude"]
        longitude = serializer.validated_data["longitude"]

        iterations = self.get_queryset().filter(id__in=iteration_ids)

        iterations_altitude = {}
        for iteration in iterations:
            iteration_id = str(iteration.id)

            if (
                iteration.captured_dsm_cog
                and iteration.captured_dsm_cog.batch_job.status
                == BatchJobStatus.COMPLETED.value
            ):
                iterations_altitude[iteration_id] = get_altitude_from_dsm_cog(
                    iteration.captured_dsm_cog.s3_uri,
                    latitude=latitude,
                    longitude=longitude,
                )
            else:
                iterations_altitude[iteration_id] = None

        response = {
            "message": f"Altitude at lat,long: {latitude,longitude} fetched successfully.",
            "data": {
                "altitudes": iterations_altitude,
            },
        }
        return Response(response)
