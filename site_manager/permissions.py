from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.request import Request

from org_manager.validators import is_object_in_same_org
from project_manager.models import Project
from project_manager.permissions import (
    has_manage_sites_permission,
    has_view_project_permission,
)
from shared.helpers import get_object_with_uuid
from user_manager.models import CustomUser

from .models import Site, SitePermission


def has_view_site_permission(user: CustomUser, site: Site) -> bool:
    return (
        SitePermission.objects.filter(
            site_id=site.id,
            can_view=True,
            user_group__in=user.groups.all(),
        ).exists()
        and has_view_project_permission(user, site.project.id)
    ) or user.is_org_admin


def has_view_site_permission_or_403(user: CustomUser, site: Site):
    if has_view_site_permission(user, site):
        return True
    raise PermissionDenied()


def has_manage_iterations_and_layers_permission(user: CustomUser, site: Site) -> bool:
    # Check if user can manage iterations & layers.
    is_manage_iterations_and_layers_permission_enabled = SitePermission.objects.filter(
        site=site,
        can_view=True,
        can_manage_iterations_and_layers=True,
        user_group__in=user.groups.all(),
    ).exists()

    is_view_project_permission_enabled = has_view_project_permission(
        user, site.project.id
    )

    return (
        is_manage_iterations_and_layers_permission_enabled
        and is_view_project_permission_enabled
    )


class HasListSitePermission(permissions.BasePermission):
    def has_permission(self, request: Request, view):
        if not request.user.is_authenticated:
            return False

        if project_id := request.query_params.get("project_id"):
            project = get_object_with_uuid(Project, id=project_id)
            if not is_object_in_same_org(request, project):
                return False
            if request.user.is_org_admin:
                return True
            return has_view_project_permission(request.user, project_id)

        return False


class HasManageSitePermission(permissions.IsAuthenticated):
    def has_object_permission(self, request: Request, view, site: Site):
        if not is_object_in_same_org(request, site):
            return False
        if request.user.is_org_admin:
            return True

        # A user can edit a site only when he/she has permission of view that site and has manage sites permission.
        return has_manage_sites_permission(
            request.user, site.project_id
        ) and has_view_site_permission(request.user, site)


class HasViewSitePermission(permissions.IsAuthenticated):
    def has_object_permission(self, request: Request, view, site: Site):
        if not is_object_in_same_org(request, site):
            return False
        if request.user.is_org_admin:
            return True

        # A user can view a site only when he/she has permission of view that site and view the project.
        return has_view_project_permission(
            request.user, site.project_id
        ) and has_view_site_permission(request.user, site)
