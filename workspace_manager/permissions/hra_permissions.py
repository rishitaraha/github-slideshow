from rest_framework import permissions
from rest_framework.request import Request

from iteration_manager.models import Iteration
from iteration_manager.permissions import can_manage_iterations
from shared.helpers import get_object_with_uuid

from ..models import HaulRoad


class HaulRoadAnalyticsListPermission(permissions.IsAuthenticated):
    def has_permission(self, request: Request, view):
        if not super().has_permission(request, view):
            return False

        iteration_id = request.GET.get("iteration")
        iteration = get_object_with_uuid(Iteration, iteration_id)

        return can_manage_iterations(request.user, iteration.site)


class HaulRoadAnalyticsCreatePermission(permissions.IsAuthenticated):
    def has_permission(self, request: Request, view):
        if not super().has_permission(request, view):
            return False

        iteration_id = request.data.get("iteration")
        iteration = get_object_with_uuid(Iteration, iteration_id)

        return can_manage_iterations(request.user, iteration.site)


class HaulRoadAnalyticsGetPermission(permissions.IsAuthenticated):
    def has_object_permission(self, request: Request, view, haul_road: HaulRoad):
        if not request.user.is_authenticated:
            return False

        return can_manage_iterations(request.user, haul_road.iteration.site)
