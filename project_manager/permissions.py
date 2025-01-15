from rest_framework import permissions
from rest_framework.request import Request

from org_manager.validators import is_object_in_same_org
from user_manager.models import CustomUser

from .models import Project, ProjectPermission


def has_view_project_permission(user: CustomUser, project_id: str) -> bool:
    return ProjectPermission.objects.filter(
        project_id=project_id,
        can_view=True,
        user_group__in=user.groups.all(),
    ).exists()


def has_manage_sites_permission(user: CustomUser, project_id: str) -> bool:
    # A user can manage sites only when he/she has both can_view and can_manage_sites permissions.
    return ProjectPermission.objects.filter(
        project_id=project_id,
        can_view=True,
        can_manage_sites=True,
        user_group__in=user.groups.all(),
    ).exists()


class HasViewProjectPermission(permissions.IsAuthenticated):
    def has_object_permission(self, request: Request, view, project: Project):
        if not is_object_in_same_org(request, project):
            return False
        if request.user.is_org_admin:
            return True
        return has_view_project_permission(request.user, project.id)
