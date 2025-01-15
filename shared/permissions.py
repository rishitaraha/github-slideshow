from rest_framework import permissions
from rest_framework.request import Request

from layer_manager.permissions import can_manage_layers, has_view_layer_permission
from project_manager.permissions import has_manage_sites_permission
from rainbow.env_variables import EnvVariable
from site_manager.permissions import has_manage_iterations_and_layers_permission

from .constants.files import FileType
from .models import FileInfo


class HasDeleteFileInfoPermission(permissions.IsAuthenticated):
    def has_object_permission(self, request: Request, view, file_info: FileInfo):
        if not super().has_object_permission(request, view, file_info):
            return False

        if request.user.is_org_admin:
            return True

        # Permission check.
        # User should be denied delete permission if:
        # 1. Either, User is not the owner of the layer attached to file.
        # 2. or, User is not the owner of the file.
        if not (
            (
                hasattr(file_info, "layerfile")
                and (layer := file_info.layerfile.layer)
                and can_manage_layers(request.user, layer)
            )
            or request.user == file_info.created_by
        ):
            return False

        return True


class HasDownloadFilePermission(permissions.IsAuthenticated):
    def has_object_permission(self, request: Request, view, file_info: FileInfo):
        if not super().has_object_permission(request, view, file_info):
            return False

        if request.user.is_org_admin:
            return True

        site = None
        iteration = None
        layer = None
        if file_info.type == FileType.BASE_DSM.value:
            site = file_info.base_dsm.first()
        elif file_info.type == FileType.LEGEND_IMAGE.value:
            site = file_info.legend_image.first()
        elif file_info.type == FileType.CAPTURED_DSM.value:
            iteration = file_info.captured_dsm_iteration.first()
        elif file_info.type in {
            FileType.ORTHOMOSAIC.value,
            FileType.ORTHOMOSAIC_COG.value,
            FileType.VECTORS.value,
            FileType.SLOPE_MAP.value,
            FileType.MBTiles.value,
        }:
            layer = file_info.layerfile.layer

        has_download_file_permission = False
        if site:
            has_download_file_permission = has_manage_sites_permission(
                request.user, site.project
            )

        if iteration:
            has_download_file_permission = has_manage_iterations_and_layers_permission(
                request.user, iteration.site
            )

        if layer:
            has_download_file_permission = has_view_layer_permission(
                request.user, layer
            )

        return has_download_file_permission


class IsMicroserviceApiKeyPresent(permissions.BasePermission):
    """
    Permission class to verify the presence and validity of the API key in the X-API-KEY header.
    """

    def has_permission(self, request, view):
        api_key = request.headers.get("X-API-KEY")

        if api_key and api_key == EnvVariable.MICROSERVICE_API_KEY.value:
            return True

        return False
