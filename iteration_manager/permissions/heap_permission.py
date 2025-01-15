from django.http import HttpRequest
from rest_framework.permissions import BasePermission, IsAuthenticated

from iteration_manager.models import HeapBoundary, Iteration
from org_manager.validators import is_object_in_same_org
from project_manager.permissions import has_view_project_permission
from shared.helpers import get_object_with_uuid
from site_manager.permissions import has_view_site_permission

# FIXME: Currently allowing all user with view iteration permission to view and manage heaps.


class HasListHeapPermission(BasePermission):
    def has_permission(self, request: HttpRequest, view):
        if not request.user.is_authenticated:
            return False

        if iteration_id := request.query_params.get("iteration_id"):
            iteration = get_object_with_uuid(Iteration, id=iteration_id)
            if not is_object_in_same_org(request, iteration):
                return False
            if request.user.is_org_admin:
                return True
            return has_view_project_permission(
                request.user, iteration.site.project_id
            ) and has_view_site_permission(request.user, iteration.site)

        return False


class HasManageHeapPermission(IsAuthenticated):
    def has_object_permission(self, request: HttpRequest, view, heap: HeapBoundary):
        if request.user.is_org_admin:
            return True

        return (
            is_object_in_same_org(request, heap)
            and has_view_project_permission(
                request.user, heap.iteration.site.project_id
            )
            and has_view_site_permission(request.user, heap.iteration.site)
        )


class HasCreateHeapPermission(IsAuthenticated):
    def has_permission(self, request: HttpRequest, view):
        if request.user.is_org_admin:
            return True

        iteration = get_object_with_uuid(Iteration, id=request.data["iteration"])

        return (
            is_object_in_same_org(request, iteration)
            and has_view_project_permission(request.user, iteration.site.project_id)
            and has_view_site_permission(request.user, iteration.site)
        )
