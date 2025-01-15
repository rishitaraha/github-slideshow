from rest_framework import permissions
from rest_framework.request import Request

from iteration_manager.models import Iteration
from org_manager.validators import is_object_in_same_org
from shared.helpers import get_object_with_uuid
from site_manager.constants import AccessType
from site_manager.models import SitePermission
from site_manager.permissions import (
    has_manage_iterations_and_layers_permission,
    has_view_site_permission,
)
from user_manager.models import CustomUser

from ..constants import LayerType
from ..models import Layer


def can_manage_layers(user: CustomUser, iteration: Iteration):
    """
    Checks if the request user has manage iterations and layers permission.
    """
    return has_manage_iterations_and_layers_permission(user, iteration.site)


def has_view_layer_permission(user: CustomUser, layer: Layer):
    all_view_access = SitePermission.objects.filter(
        site_id=layer.site.id,
        user_group_id__in=user.groups.all(),
        access_type=AccessType.BASIC.value,
        can_view=True,
    ).exists()

    if all_view_access:
        return True

    return user.groups.filter(access_tags__in=layer.access_tags.all()).exists()


class HasListLayersPermission(permissions.IsAuthenticated):
    def has_permission(self, request: Request, view):
        if not super().has_permission(request, view):
            return False

        iteration = get_object_with_uuid(Iteration, id=request.GET.get("iteration_id"))

        if not is_object_in_same_org(request, iteration):
            return False
        if request.user.is_org_admin:
            return True

        return has_view_site_permission(request.user, iteration.site)


class HasGetLayersPermission(permissions.IsAuthenticated):
    def has_object_permission(self, request: Request, view, layer: Layer):
        if not super().has_permission(request, view):
            return False

        if not is_object_in_same_org(request, layer):
            return False
        if request.user.is_org_admin:
            return True

        # If user has view site permission they should be able to see all the ortho layers.
        has_view_permission = (
            layer.type == LayerType.ORTHOMOSAIC.value
            or has_view_layer_permission(request.user, layer)
        )

        return (
            has_view_site_permission(request.user, layer.site) and has_view_permission
        )


class HasManageIterationLayersPermission(permissions.IsAuthenticated):
    def has_object_permission(self, request: Request, view, layer: Layer):
        if not super().has_permission(request, view):
            return False

        if not is_object_in_same_org(request, layer):
            return False

        if request.user.is_org_admin:
            return True

        if not can_manage_layers(request.user, layer.iteration):
            return False

        return has_view_site_permission(
            request.user, layer.site
        ) and has_view_layer_permission(request.user, layer)


class HasCreateLayerPermission(permissions.IsAuthenticated):
    def has_permission(self, request: Request, view):
        if not super().has_permission(request, view):
            return False

        iteration = get_object_with_uuid(Iteration, id=request.data["iteration"])

        if not is_object_in_same_org(request, iteration):
            return False

        if request.user.is_org_admin:
            return True

        return can_manage_layers(request.user, iteration)
