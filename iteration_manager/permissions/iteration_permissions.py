from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.request import Request

from org_manager.validators import is_object_in_same_org
from project_manager.permissions import has_view_project_permission
from shared.helpers import get_object_with_uuid
from site_manager.models import Site
from site_manager.permissions import (
    has_manage_iterations_and_layers_permission,
    has_view_site_permission,
)
from user_manager.models import CustomUser

from ..models import Iteration


def can_manage_iterations(user: CustomUser, site: Site):
    return user.is_org_admin or (
        has_manage_iterations_and_layers_permission(user, site)
    )


def can_manage_iterations_or_403(user: CustomUser, site: Site):
    if can_manage_iterations(user, site):
        return True
    raise PermissionDenied()


def can_view_iterations(user: CustomUser, site: Site):
    return user.is_org_admin or (
        has_view_site_permission(user, site)
        and has_view_project_permission(user, site.project)
    )


def can_view_iterations_or_403(user: CustomUser, site: Site):
    if can_view_iterations(user, site):
        return True
    raise PermissionDenied()


class HasGetIterationPermission(permissions.BasePermission):
    def has_object_permission(self, request: Request, view, iteration: Iteration):
        if not (
            request.user.is_authenticated and is_object_in_same_org(request, iteration)
        ):
            return False

        if request.user.is_org_admin:
            return True

        return has_view_project_permission(
            request.user, iteration.site.project.id
        ) and has_view_site_permission(request.user, iteration.site)


class HasListIterationsPermission(permissions.BasePermission):
    def has_permission(self, request: Request, view):
        if not request.user.is_authenticated:
            return False

        if site_id := request.query_params.get("site_id"):
            site = get_object_with_uuid(Site, id=site_id)
            if not is_object_in_same_org(request, site):
                return False
            if request.user.is_org_admin:
                return True
            return has_view_project_permission(
                request.user, site.project.id
            ) and has_view_site_permission(request.user, site)

        return False


class HasManageIterationsPermission(permissions.IsAuthenticated):
    def has_object_permission(self, request: Request, view, iteration: Iteration):
        return is_object_in_same_org(request, iteration) and can_manage_iterations(
            request.user, iteration.site
        )


class HasManageDatasetPermission(permissions.IsAuthenticated):
    def has_object_permission(self, request: Request, view, site: Site):
        return is_object_in_same_org(request, site) and can_manage_iterations(
            request.user, site
        )


class HasCreateIterationPermission(permissions.IsAuthenticated):
    def has_permission(self, request: Request, view):
        site = get_object_with_uuid(Site, id=request.data["site"])
        return is_object_in_same_org(request, site) and can_manage_iterations(
            request.user, site
        )
