from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from org_manager.permissions import HasOrgAccessToken

from .serializers import (
    GetPlanningKpiSerializer,
    GetProductionKpiSerializer,
    GetSafetyIndexKpiSerializer,
    GetStockVolumeKpiSerializer,
)


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated | HasOrgAccessToken]

    @action(
        detail=False,
        methods=["get"],
        url_path="production-kpi",
    )
    def production_kpi(self, request):
        serializer = GetProductionKpiSerializer(
            data=request.query_params, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        response = {
            "message": "KPI fetched successfully",
            "data": serializer.data,
        }
        return Response(response)

    @action(
        detail=False,
        url_path="planning-kpi",
        methods=["get"],
    )
    def planning_kpi(self, request):
        serializer = GetPlanningKpiSerializer(
            data=request.query_params, context={"request": request}
        )

        serializer.is_valid(raise_exception=True)

        response = {
            "message": "Planning KPI fetched successfully",
            "data": serializer.data,
        }
        return Response(response)

    @action(
        detail=False,
        methods=["get"],
        url_path="stock-volume-kpi",
    )
    def stock_volume_kpi(self, request):
        serializer = GetStockVolumeKpiSerializer(
            data=request.query_params, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        response = {
            "message": "Stock Volume KPI fetched successfully",
            "data": serializer.data,
        }
        return Response(response)

    @action(
        detail=False,
        methods=["get"],
        url_path="safety-index-kpi",
    )
    def safety_index_kpi(self, request):
        serializer = GetSafetyIndexKpiSerializer(
            data=request.query_params, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        response = {
            "message": "Safety Index KPI fetched successfully",
            "data": serializer.data,
        }
        return Response(response)
