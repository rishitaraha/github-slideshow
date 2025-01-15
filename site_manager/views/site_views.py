from rest_framework import exceptions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from org_manager.helpers import get_current_org
from org_manager.permissions import HasOrgAccessToken
from project_manager.models import Project
from project_manager.permissions import has_manage_sites_permission
from shared.constants import FileType
from shared.exception_handling import ValidationErrors
from shared.helpers import (
    complete_multipart_upload,
    create_s3_file_key,
    delete_file_from_s3,
    filter_dynamic_fields,
    get_object_with_uuid,
    get_presigned_url,
    paginate_data,
    start_uploading_file,
)
from shared.serializers import (
    FileUploadCompleteSerializer,
    FileUploadSerializer,
    GetPresignedUrlSerializer,
)
from user_manager.permissions import IsOrgAdmin

from ..models import Site, SitePermission
from ..permissions import (
    HasListSitePermission,
    HasManageSitePermission,
    HasViewSitePermission,
)
from ..serializers import (
    GetSitePermissionSerializer,
    RetrieveSiteSerializer,
    SitePermissionSerializer,
    SiteSerializer,
    UpdateSiteSerializer,
)


class SiteViewSet(viewsets.ViewSet):
    serializer_class = SiteSerializer
    permission_classes = [HasManageSitePermission]

    def get_queryset(self):
        org = get_current_org(self.request)
        return Site.objects.filter(project__org=org)

    def get_object(self, pk=None):
        site = get_object_with_uuid(self.get_queryset(), id=pk)
        self.check_object_permissions(self.request, site)
        return site

    def get_permissions(self):
        if self.action == "list":
            self.permission_classes = [HasListSitePermission | HasOrgAccessToken]
        elif self.action in ["create", "destroy"]:
            self.permission_classes = [IsOrgAdmin]
        elif self.action == "retrieve":
            self.permission_classes = [HasViewSitePermission]
        return super().get_permissions()

    def list(self, request):
        project_id = request.GET.get("project_id")
        project = get_object_with_uuid(Project, project_id)

        if request.user.is_authenticated:
            sites = Site.objects.get_sites_for_user(request.user)
        else:
            sites = self.get_queryset()

        sites = filter_dynamic_fields(
            sites.filter(project_id=project_id), self.request.query_params
        )

        if search_param := self.request.query_params.get("search"):
            sites = sites.filter(name__icontains=search_param)

        page_number = request.GET.get("page")
        page_size = request.GET.get("page_size")
        paginated_data, total_count = paginate_data(page_number, page_size, sites)

        include_fields = self.request.query_params.get("include_fields")
        exclude_fields = self.request.query_params.get("exclude_fields")
        serializer = self.serializer_class(
            paginated_data,
            many=True,
            include_fields=include_fields,
            exclude_fields=exclude_fields,
            context={"user": request.user},
        )

        can_manage_sites = False
        if request.user.is_authenticated:
            can_manage_sites = request.user.is_org_admin or has_manage_sites_permission(
                request.user, project_id
            )

        response_data = {
            "sites": serializer.data,
            "total": total_count,
            "project": project.name,
            "can_manage_sites": can_manage_sites,
        }

        response = {
            "message": "Sites fetched successfully.",
            "data": response_data,
        }
        return Response(response)

    def create(self, request):
        data = request.data.copy()
        serializer = self.serializer_class(
            data=data,
            context={"user": request.user},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": "Site created successfully.",
            "data": serializer.data,
        }
        return Response(response, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        site = self.get_object(pk)
        serializer = RetrieveSiteSerializer(site)
        response_data = serializer.data.copy()

        # Send site permissions data only when user is org admin.
        if request.user.is_org_admin:
            permissions_serializer = GetSitePermissionSerializer(
                site.permissions.all(), many=True
            )
            response_data["permissions"] = permissions_serializer.data

        response = {
            "message": "Site fetched successfully.",
            "data": response_data,
        }
        return Response(response)

    def partial_update(self, request, pk=None):
        site = self.get_object(pk)
        serializer = UpdateSiteSerializer(site, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": "Site updated successfully.",
            "data": serializer.data,
        }
        return Response(response)

    def destroy(self, request, pk=None):
        site = self.get_object(pk)
        site.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="upload-file")
    def upload_file(self, request, pk=None):
        site = self.get_object(pk)
        serializer = FileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        filename = serializer.data.get("filename")
        filetype = serializer.data.get("filetype")
        if filetype == FileType.BASE_DSM.value:
            key = create_s3_file_key(filetype, f"{str(site.id)}.tif")
            base_dsm, upload_id = start_uploading_file(
                key=key, filename=filename, filetype=filetype
            )
            site.base_dsm = base_dsm
            site.save(update_fields=["base_dsm"])
        elif filetype == FileType.LEGEND_IMAGE.value:
            file_extension = filename.split(".")[-1]
            key = create_s3_file_key(filetype, f"{site.id}.{file_extension}")
            legend_image, upload_id = start_uploading_file(
                key=key,
                filename=filename,
                filetype=filetype,
            )
            site.legend_image = legend_image
            site.save(update_fields=["legend_image"])
        else:
            raise exceptions.UnsupportedMediaType(
                ValidationErrors.INVALID_FILE_TYPE.value
            )
        response = {
            "message": f"UploadId generated for {site.name}",
            "data": {
                "site": site.id,
                "upload_id": upload_id,
            },
        }
        return Response(response)

    @action(detail=True, methods=["post"], url_path="presigned-url")
    def presigned_url(self, request, pk=None):
        site = self.get_object(pk)
        serializer = GetPresignedUrlSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        upload_id = serializer.data.get("upload_id")
        part_number = serializer.data.get("part_number")
        filetype = serializer.data.get("filetype")
        if filetype == FileType.BASE_DSM.value:
            signed_url = get_presigned_url(
                site.base_dsm.bucket_name, site.base_dsm.s3_key, upload_id, part_number
            )
        elif filetype == FileType.LEGEND_IMAGE.value:
            signed_url = get_presigned_url(
                site.legend_image.bucket_name,
                site.legend_image.s3_key,
                upload_id,
                part_number,
            )
        else:
            raise exceptions.UnsupportedMediaType(
                ValidationErrors.INVALID_FILE_TYPE.value
            )
        response = {
            "message": "Presigned url generated for " + site.name,
            "data": {"site": site.id, "url": signed_url},
        }
        return Response(response)

    @action(detail=True, methods=["post"], url_path="complete-upload")
    def complete_upload(self, request, pk=None):
        site = self.get_object(pk)
        serializer = FileUploadCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        upload_id = serializer.data.get("upload_id")
        parts = serializer.data.get("parts")
        filetype = serializer.data.get("filetype")
        if filetype == FileType.BASE_DSM.value:
            uploaded = complete_multipart_upload(site.base_dsm, parts, upload_id)
        elif filetype == FileType.LEGEND_IMAGE.value:
            uploaded = complete_multipart_upload(site.legend_image, parts, upload_id)
        else:
            raise exceptions.UnsupportedMediaType(
                ValidationErrors.INVALID_FILE_TYPE.value
            )

        response = {
            "success": uploaded,
            "message": "File upload " + ("completed" if uploaded else "failed"),
            "data": {"site": site.id},
        }
        return Response(response)

    @action(detail=True, methods=["delete"], url_path="base-dsm")
    def delete_base_dsm(self, request, pk=None):
        site = self.get_object(pk)
        if is_base_dsm_deleted := delete_file_from_s3(site.base_dsm):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return exceptions.server_error(request)

    @action(detail=True, methods=["delete"], url_path="legend-image")
    def delete_legend_image(self, request, pk=None):
        site = self.get_object(pk)
        if is_legend_image_deleted := delete_file_from_s3(site.legend_image):
            return Response(status=status.HTTP_204_NO_CONTENT)
        return exceptions.server_error(request)

    @action(
        detail=True,
        methods=["post"],
        serializer_class=SitePermissionSerializer,
        permission_classes=[IsOrgAdmin],
    )
    def permission(self, request, pk=None):
        data = request.data.copy()
        site = self.get_object(pk)
        data["site"] = site.id
        user_group_id = data.get("user_group")

        if not user_group_id:
            raise exceptions.ValidationError(ValidationErrors.USER_GROUP_REQUIRED.value)

        site_permission = SitePermission.objects.filter(
            site_id=pk, user_group_id=user_group_id
        ).first()

        if site_permission:
            serializer = self.serializer_class(
                site_permission,
                data=data,
                partial=True,
                context={"request": request},
            )
        else:
            serializer = self.serializer_class(data=data, context={"request": request})

        serializer.is_valid(raise_exception=True)
        serializer.save()

        response = {
            "message": f"Site permission {'updated' if site_permission else 'created'} successfully.",
            "data": serializer.data,
        }
        return Response(response)
