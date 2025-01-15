import io
from decimal import Decimal

import pandas as pd
from django.db.models import Count
from django.db.models.functions import Coalesce
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from iteration_manager.permissions import HasManageDatasetPermission
from org_manager.permissions import IsFeatureFlagEnabled
from shared.constants import EPSG
from shared.helpers import filter_dynamic_fields, paginate_data

from ..models import GCP
from ..serializers import (
    DatasetQueryParamSerializer,
    GCPBulkDeleteSerializer,
    GCPBulkUpdateSerializer,
    GCPFileUploadSerializer,
    GCPImagesSerializer,
    GCPListQueryParamsSerializer,
    GCPSerializer,
    GCPUpdateSerializer,
)


class GCPViewSet(ViewSet):
    permission_classes = [IsFeatureFlagEnabled, HasManageDatasetPermission]
    serializer_class = GCPSerializer

    def get_queryset(self, filter_conditions):
        queryset = (
            GCP.objects.filter(**filter_conditions)
            .annotate(number_of_images_tagged=Coalesce(Count("gcpimagetag"), 0))
            .order_by("created_at")
        )
        return filter_dynamic_fields(queryset, self.request.query_params)

    def get_object(self, id):
        gcp = (
            GCP.objects.filter(id=id)
            .annotate(number_of_images_tagged=Coalesce(Count("gcpimagetag"), 0))
            .first()
        )
        return gcp

    def create(self, request):
        dataset_query_param_serializer = DatasetQueryParamSerializer(data=request.data)
        # TODO: This validation is done twice. Remove this in serializer.
        dataset_query_param_serializer.is_valid(raise_exception=True)
        dataset_query_param_validated_data = (
            dataset_query_param_serializer.validated_data
        )
        parent_dataset = dataset_query_param_validated_data.get(
            "iteration_dataset"
        ) or dataset_query_param_validated_data.get("merged_dataset")
        site = getattr(parent_dataset, "iteration", parent_dataset).site
        self.check_object_permissions(self.request, site)

        gcp_file_serializer = GCPFileUploadSerializer(data=request.data)
        gcp_file_serializer.is_valid(raise_exception=True)
        gcp_file_serializer.save()

        response = {"message": "gcps_added_successfully"}

        return Response(response)

    def list(self, request):
        gcp_list_serializer = GCPListQueryParamsSerializer(data=request.GET)
        gcp_list_serializer.is_valid(raise_exception=True)
        validated_query_param = gcp_list_serializer.validated_data

        empty_gcp_data = {
            "message": "gcp_list_fetched_successfully",
            "data": {"gcps": [], "total": 0},
        }
        filter_conditions = {}
        if iteration_dataset := validated_query_param.get("iteration_dataset"):
            if not iteration_dataset.are_gcps_present:
                return Response(empty_gcp_data)
            self.check_object_permissions(
                self.request, iteration_dataset.iteration.site
            )
            filter_conditions["iteration_dataset"] = iteration_dataset

        elif merged_dataset := validated_query_param.get("merged_dataset"):
            if not merged_dataset.are_gcps_present:
                return Response(empty_gcp_data)
            self.check_object_permissions(self.request, merged_dataset.site)
            filter_conditions["merged_dataset"] = merged_dataset

        if search_param := validated_query_param.get("search"):
            filter_conditions["label__icontains"] = search_param

        gcp_queryset = self.get_queryset(filter_conditions)
        page_number = validated_query_param.get("page_number", 0)
        page_size = validated_query_param.get("page_size", 50)

        paginated_data, total_count = paginate_data(
            page_number, page_size, gcp_queryset
        )
        gcp_data = self.serializer_class(paginated_data, many=True).data

        return Response(
            {
                "message": "gcp_list_fetched_successfully",
                "data": {"gcps": gcp_data, "total": total_count},
            }
        )

    @action(detail=False, methods=["get"])
    def download(self, request):
        dataset_query_param_serializer = DatasetQueryParamSerializer(data=request.GET)
        dataset_query_param_serializer.is_valid(raise_exception=True)
        dataset_query_param_validated_data = (
            dataset_query_param_serializer.validated_data
        )
        parent_dataset = dataset_query_param_validated_data.get(
            "iteration_dataset"
        ) or dataset_query_param_validated_data.get("merged_dataset")
        site = getattr(parent_dataset, "iteration", parent_dataset).site
        self.check_object_permissions(self.request, site)
        empty_gcp_data = {
            "message": "gcp_list_fetched_successfully",
            "data": {"gcps": [], "total": 0},
        }
        if not parent_dataset.are_gcps_present:
            return Response(empty_gcp_data)

        param_serializer = GCPListQueryParamsSerializer(data=request.GET)
        param_serializer.is_valid(raise_exception=True)

        gcp_values_to_fetch = [
            "label",
            "x_coordinate",
            "y_coordinate",
            "z_coordinate",
        ]
        gcp_data = parent_dataset.gcps.values(*gcp_values_to_fetch).order_by("label")

        df = pd.DataFrame.from_records(gcp_data)
        columns = df.columns[1:]
        for key in columns:
            df[key] = df[key].apply(
                lambda x: x.normalize() if isinstance(x, Decimal) else x
            )
        buffer = io.BytesIO()
        df.to_csv(buffer, index=False, header=False)
        buffer.seek(0)
        file_name = f"gcp.txt"
        response = HttpResponse(
            buffer,
            content_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={file_name}"},
        )
        return response

    def partial_update(self, request, pk):
        gcp = get_object_or_404(GCP, pk=pk)
        parent_dataset = gcp.iteration_dataset or gcp.merged_dataset
        site = getattr(parent_dataset, "iteration", parent_dataset).site
        self.check_object_permissions(self.request, site)

        gcp_data = request.data.get("gcp")
        parent_srid = parent_dataset.gcp_horizontal_crs.srid
        is_utm = parent_srid != EPSG.WGS84.value

        update_gcp_context = {"is_utm": is_utm}

        update_gcp_serializer = GCPUpdateSerializer(
            gcp, data=gcp_data, context=update_gcp_context, partial=True
        )
        update_gcp_serializer.is_valid(raise_exception=True)
        update_gcp_serializer.save()

        gcp_obj = self.get_object(id=gcp.id)

        updated_gcp = GCPSerializer(gcp_obj).data

        response = {
            "message": "gcp_information_updated_successfully",
            "data": {"gcp": updated_gcp},
        }
        return Response(response)

    @action(
        detail=False,
        methods=["post"],
        url_path="delete",
        url_name="bulk_delete",
    )
    def bulk_delete(self, request):
        dataset_query_param_serializer = DatasetQueryParamSerializer(data=request.data)

        dataset_query_param_serializer.is_valid(raise_exception=True)
        dataset_query_param_validated_data = (
            dataset_query_param_serializer.validated_data
        )
        parent_dataset = dataset_query_param_validated_data.get(
            "iteration_dataset"
        ) or dataset_query_param_validated_data.get("merged_dataset")
        site = getattr(parent_dataset, "iteration", parent_dataset).site
        self.check_object_permissions(self.request, site)

        bulk_delete_serializer = GCPBulkDeleteSerializer(data=request.data)
        bulk_delete_serializer.is_valid(raise_exception=True)
        bulk_delete_serializer.bulk_delete(
            instances=parent_dataset.gcps.all(),
            validated_data=bulk_delete_serializer.validated_data,
        )

        if parent_dataset.gcps.all().count() == 0:
            parent_dataset.are_gcps_present = False
            parent_dataset.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=False,
        methods=["patch"],
        url_path="bulk",
    )
    def bulk_update(self, request):
        dataset_query_param_serializer = DatasetQueryParamSerializer(data=request.data)
        dataset_query_param_serializer.is_valid(raise_exception=True)
        dataset_query_param_validated_data = (
            dataset_query_param_serializer.validated_data
        )
        parent_dataset = dataset_query_param_validated_data.get(
            "iteration_dataset"
        ) or dataset_query_param_validated_data.get("merged_dataset")
        site = getattr(parent_dataset, "iteration", parent_dataset).site
        self.check_object_permissions(self.request, site)

        serializer = GCPBulkUpdateSerializer(
            data=request.data, context={"parent_dataset": parent_dataset}
        )
        serializer.is_valid(raise_exception=True)

        gcps = serializer.update(
            instance=parent_dataset.gcps.all(),
            validated_data=serializer.validated_data,
        )

        if gcps:
            output_serializer = GCPSerializer(gcps, many=True)
            response = {
                "message": "gcps_updated_successfully",
                "data": {
                    "gcps": output_serializer.data,
                    "total": len(gcps),
                },
            }
            return Response(response)

    @action(
        detail=True,
        methods=["get"],
        url_path="images",
    )
    def images(self, request, pk):
        gcp = get_object_or_404(
            GCP.objects.all().select_related(
                "iteration_dataset__iteration__site", "merged_dataset__site"
            ),
            pk=pk,
        )
        parent_dataset = gcp.iteration_dataset or gcp.merged_dataset
        site = getattr(parent_dataset, "iteration", parent_dataset).site
        self.check_object_permissions(self.request, site)

        gcp_srid = parent_dataset.gcp_horizontal_crs.srid
        if geotag_crs := parent_dataset.geotag_horizontal_crs:
            geotag_srid = geotag_crs.srid
        else:
            geotag_srid = EPSG.WGS84.value

        page_number = int(request.GET.get("page_number", "0"))
        page_size = int(request.GET.get("page_size", "8"))

        gcp_images_serializer = GCPImagesSerializer(
            data={
                "page_number": page_number,
                "page_size": page_size,
                "gcp_srid": gcp_srid,
                "geotag_srid": geotag_srid,
            },
            context={"gcp": gcp},
        )
        gcp_images_serializer.is_valid(raise_exception=True)
        gcp_images_validated_data = gcp_images_serializer.validated_data
        geotag_images_data = gcp_images_serializer.retrieve_geotag_images_data(
            gcp_images_validated_data
        )

        return Response(
            {
                "message": "gcp_images_list_fetched_successfully",
                "data": {"images": geotag_images_data},
            }
        )
