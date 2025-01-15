from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from assets.assets_path import AssetPath
from iteration_manager.models import Iteration
from org_manager.helpers import get_current_org
from org_manager.permissions import HasOrgAccessToken
from shared.exception_handling import ValidationErrors
from shared.helpers import get_financial_year, get_object_with_uuid

from ..constants import KpiType
from ..models import Site
from ..permissions import HasManageSitePermission, HasViewSitePermission
from ..serializers import (
    SiteSerializer,
    UploadProductionKpiSerializer,
    UploadSafetyIndexKpiSerializer,
    UploadStockVolumeKpiSerializer,
)


class KpiViewSet(viewsets.ViewSet):
    serializer_class = SiteSerializer
    permission_classes = [HasManageSitePermission]

    def get_queryset(self):
        org = get_current_org(self.request)
        sites = Site.objects.filter(project__org=org)
        return sites

    def get_object(self, pk=None):
        site = get_object_with_uuid(self.get_queryset(), id=pk)
        self.check_object_permissions(self.request, site)
        return site

    @action(
        detail=True,
        methods=["post"],
        url_path="production-kpi",
    )
    def production_kpi(self, request, pk=None):
        site = self.get_object(pk)
        data = request.data
        data["site"] = str(site.id)
        serializer = UploadProductionKpiSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response = {
            "message": "Production KPI uploaded successfully.",
            "data": serializer.data,
        }
        return Response(response)

    @action(
        detail=True,
        methods=["post"],
        url_path="stock-volume-kpi",
    )
    def stock_volume_kpi(self, request, pk=None):
        site = self.get_object(pk)
        data = request.data
        data["site"] = str(site.id)
        serializer = UploadStockVolumeKpiSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response = {
            "message": "Stock volume KPI uploaded successfully.",
            "data": serializer.data,
        }
        return Response(response)

    @action(
        detail=True,
        methods=["post"],
        url_path="safety-index-kpi",
    )
    def safety_index_kpi(self, request, pk=None):
        site = self.get_object(pk)
        data = request.data
        data["site"] = str(site.id)
        serializer = UploadSafetyIndexKpiSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response = {
            "message": "Safety index KPI uploaded successfully.",
            "data": serializer.data,
        }
        return Response(response)

    @action(
        detail=True,
        methods=["get"],
        url_path="financial-years",
        permission_classes=[HasViewSitePermission | HasOrgAccessToken],
    )
    def financial_years(self, request, pk=None):
        """
        Return a list of financial years from the first created iteration date to the latest iteration date of the given site.
        """
        site = self.get_object(pk)
        first_iteration = Iteration.objects.filter(site=site).order_by("date").first()
        latest_iteration = Iteration.objects.filter(site=site).order_by("-date").first()

        site_financial_years = []

        if first_iteration and latest_iteration:
            financial_year_of_first_iteration = get_financial_year(first_iteration.date)
            financial_year_of_latest_iteration = get_financial_year(
                latest_iteration.date
            )

            site_financial_years = [
                f"{financial_year}-{financial_year + 1}"
                for financial_year in range(
                    financial_year_of_first_iteration["start_year"],
                    financial_year_of_latest_iteration["end_year"],
                )
            ]

        response = {
            "message": "Financial year of site fetched successfully.",
            "data": site_financial_years,
        }

        return Response(response)

    @action(
        detail=False,
        url_path="kpi-template/(?P<kpi_type>[^/.]+)",
        methods=["get"],
        permission_classes=[IsAuthenticated],
    )
    def kpi_template(self, request, kpi_type):
        template_file_path = ""
        if kpi_type == KpiType.PRODUCTION.value:
            template_file_path = AssetPath.PRODUCTION_KPI_CSV_TEMPLATE.value

        elif kpi_type == KpiType.SAFETY_INDEX.value:
            template_file_path = AssetPath.SAFETY_INDEX_KPI_CSV_TEMPLATE.value

        elif kpi_type == KpiType.STOCK_VOLUME.value:
            template_file_path = AssetPath.STOCK_VOLUME_KPI_CSV_TEMPLATE.value

        else:
            raise ValidationError(ValidationErrors.INVALID_KPI_TYPE.value)

        with open(template_file_path) as template_file:
            response = HttpResponse(
                template_file.read(),
                content_type="application/csv",
            )
            response[
                "Content-Disposition"
            ] = f"attachment; filename=production_kpi_template.csv;"

            return response
