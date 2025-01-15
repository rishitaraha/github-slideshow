import csv
from io import StringIO

from django.core.files.base import ContentFile
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from analytics_engine_manager.operations import calculate_volume
from org_manager.validators import validate_org_ownership
from shared.exception_handling import ValidationErrors
from shared.helpers import (
    get_download_url,
    get_object_with_uuid,
    parse_list_param,
    render_pdf,
    slugify,
)

from ..constants import BaseReference, VolumeReportFormat
from ..models import HeapBoundary, Iteration
from ..permissions import (
    HasCreateHeapPermission,
    HasListHeapPermission,
    HasManageHeapPermission,
)
from ..serializers import (
    CreateHeapBoundarySerializer,
    HeapBoundarySerializer,
    UpdateHeapBoundarySerializer,
)
from ..validators import heaps_has_same_iteration_or_400


class HeapBoundaryViewSet(viewsets.ViewSet):
    serializer_class = HeapBoundarySerializer
    permission_classes = [HasManageHeapPermission]

    def get_permissions(self):
        if self.action == "list":
            self.permission_classes = [HasListHeapPermission]
        elif self.action == "create":
            self.permission_classes = [HasCreateHeapPermission]
        return super().get_permissions()

    def get_queryset(self):
        heap_boundary = HeapBoundary.objects.filter(
            iteration__site__project__org=self.request.user.org
        )
        return heap_boundary

    def get_object(self, pk):
        heap_boundary = get_object_with_uuid(self.get_queryset(), id=pk)
        self.check_object_permissions(self.request, heap_boundary)
        return heap_boundary

    def list(self, request):
        heap_boundaries = self.get_queryset()
        if iteration_id := request.query_params.get("iteration_id"):
            heap_boundaries = heap_boundaries.filter(iteration_id=iteration_id)
        else:
            raise ValidationError(ValidationErrors.INVALID_PARAMETER.value)
        serializer = self.serializer_class(heap_boundaries, many=True)
        response = {
            "message": "Heap boundaries fetched successfully.",
            "data": serializer.data,
        }

        return Response(response)

    def create(self, request):
        iteration = get_object_with_uuid(Iteration, id=request.data["iteration"])
        validate_org_ownership(request, iteration, raise_exception=True)
        serializer = CreateHeapBoundarySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": "Heap Boundary added successfully!",
            "data": serializer.data,
        }
        return Response(response, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        heap_boundary = self.get_object(pk)
        serializer = self.serializer_class(heap_boundary)
        response = {
            "message": "Heap fetched successfully.",
            "data": serializer.data,
        }
        return Response(response)

    def partial_update(self, request, pk=None):
        heap_boundary = self.get_object(pk)
        serializer = UpdateHeapBoundarySerializer(
            heap_boundary, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        response = {
            "message": "Heap details updated successfully.",
            "data": serializer.data,
        }
        return Response(response)

    def destroy(self, request, pk=None):
        heap_boundary = self.get_object(pk)
        heap_boundary.delete()
        return Response({"message": "Heap deleted successfully!"})

    @action(detail=True, methods=["post"], url_path="recalculate-volume")
    def recalculate_volume(self, request, pk=None):
        heap_boundary: HeapBoundary = self.get_object(pk)
        base_reference = heap_boundary.base_reference

        base_dsm_s3_key = None
        if base_reference == BaseReference.OtherIterationDsm.value:
            base_dsm_s3_key = heap_boundary.base_iteration.get_dsm_or_404().s3_key

        elif base_reference == BaseReference.SiteBaseDsm.value:
            base_dsm_s3_key = heap_boundary.iteration.site.get_base_dsm_or_404().s3_key

        volume, status_code = calculate_volume(
            str(heap_boundary.iteration_id),
            heap_boundary.iteration.get_dsm_or_404().s3_key,
            heap_boundary.geometry.wkt,
            base_dsm_s3_key,
        )

        cut_volume = volume.get("cut_volume")
        fill_volume = volume.get("fill_volume")
        net_volume = volume.get("net_volume")

        heap_boundary.cut_volume = cut_volume
        heap_boundary.fill_volume = fill_volume
        heap_boundary.net_volume = net_volume

        # Calculating weight.
        if bulk_density := heap_boundary.bulk_density:
            heap_boundary.cut_weight = cut_volume * bulk_density
            heap_boundary.fill_weight = fill_volume * bulk_density
            heap_boundary.net_weight = net_volume * bulk_density

        heap_boundary.save(
            update_fields=[
                "cut_volume",
                "fill_volume",
                "net_volume",
                "cut_weight",
                "fill_weight",
                "net_weight",
            ]
        )

        serializer = self.serializer_class(heap_boundary)

        response = {
            "message": "Volume recalculated successfully.",
            "data": serializer.data,
            "status_code": status_code,
        }

        return Response(response)

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        heap_boundary: HeapBoundary = self.get_object(pk)

        filename = f"{slugify(heap_boundary.name)}.geojson"
        geojson = heap_boundary.geometry.geojson

        geojson_file = ContentFile(geojson, filename)

        response = HttpResponse(geojson_file, content_type="application/json")
        # Adding attachment in content disposition so that file gets downloaded automatically.
        response["Content-Disposition"] = f"attachment; filename={filename}"
        return response

    @action(
        detail=False,
        methods=["get"],
        url_path="volume-report",
    )
    def volume_report(self, request):
        heap_ids = parse_list_param(request.query_params, "ids")
        response_format = request.query_params.get("response_format")

        heaps = self.get_queryset().filter(id__in=heap_ids)
        iteration = heaps_has_same_iteration_or_400(heaps)

        if response_format == VolumeReportFormat.PDF.value:
            user_organisation = request.user.org
            org_logo_presigned_url = ""
            if user_organisation.logo:
                org_logo_presigned_url = get_download_url(user_organisation.logo)

            template_params = {
                "organisation_logo": org_logo_presigned_url,
                "organsation_name": user_organisation.name,
                "project_name": iteration.site.project.name,
                "site_name": iteration.site.name,
                "iteration_name": iteration.name,
                "heaps": heaps,
            }

            pdf_file = render_pdf("reports/volume_report.html", template_params)

            filename = f"{iteration.name}_volume_report.pdf"

            response = HttpResponse(pdf_file, content_type="application/pdf")
            response["Content-Disposition"] = f"attachment; filename={filename};"

        elif response_format == VolumeReportFormat.CSV.value:
            csv_column_names = [
                "Name of the Heap",
                "Iteration Name",
                "Base Iteration DSM",
                "Description",
                "Bulk Density",
                "Type of Production",
                "Category of Volume",
                "Cut Volume(m³)",
                "Fill Volume(m³)",
                "Net Volume(m³)",
                "Cut Weight(tonnes)",
                "Fill Weight(tonnes)",
                "Net Weight(tonnes)",
            ]
            csv_file = StringIO()

            # create CSV writer object
            writer = csv.writer(csv_file)
            writer.writerow(csv_column_names)

            for heap in heaps:
                base_iteration_name = None

                if heap.base_iteration:
                    base_iteration_name = heap.base_iteration.name

                writer.writerow(
                    [
                        heap.name,
                        heap.iteration.name,
                        base_iteration_name,
                        heap.remarks,
                        heap.bulk_density,
                        heap.material_type,
                        heap.category,
                        heap.cut_volume,
                        heap.fill_volume,
                        heap.net_volume,
                        heap.cut_weight,
                        heap.fill_weight,
                        heap.net_weight,
                    ]
                )

            filename = f"{iteration.name}_volume_report.csv"
            response = HttpResponse(csv_file.getvalue(), content_type="application/csv")
            response["Content-Disposition"] = f"attachment; filename={filename};"

        else:
            raise ValidationError(ValidationErrors.INVALID_RESPONSE_FORMAT.value)

        return response
