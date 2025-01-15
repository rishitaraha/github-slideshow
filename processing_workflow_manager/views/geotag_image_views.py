import io
from decimal import Decimal

import pandas as pd
from django.core.paginator import InvalidPage, Paginator
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from iteration_manager.permissions import HasManageDatasetPermission
from org_manager.permissions import IsFeatureFlagEnabled
from processing_workflow_manager.serializers.general_serializers import (
    DatasetQueryParamSerializer,
)
from processing_workflow_manager.serializers.geotag_image_serializers import (
    GeotagImageBulkDeleteSerializer,
)
from shared.aws import AwsManager
from shared.constants import EPSG

from ..constants import DatasetType
from ..helpers import (
    combined_geotag_image_q_filter,
    copy_from_csv_buffer,
    existing_geotag_image_handler,
    generate_geotag_df_from_csv,
    generate_in_mem_buffer,
)
from ..models.geotag_image_models import GeotagImage
from ..serializers import (
    DatasetQueryParamSerializer,
    GeotagImageBulkUpdateSerializer,
    GeotagImageCreateSerializer,
    GeotagImageDownloadParamsSerializer,
    GeotagImageListQueryParamsSerializer,
    GeotagImageSerializer,
    GeotagImageUpdateSerializer,
)


class GeotagImageViewSet(ViewSet):
    permission_classes = [HasManageDatasetPermission, IsFeatureFlagEnabled]

    def create(self, request):
        # TODO: Refactor serializer intialization and permissions check.
        # TODO: Move data fetching logic inside serializer.
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

        serializer = GeotagImageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        geotag_horizontal_crs = validated_data.get("geotag_horizontal_crs")
        geotag_vertical_crs = validated_data.get("geotag_vertical_crs")
        geotag_rotation_angle = validated_data.get("geotag_rotation_angle")

        merged_dataset = validated_data.get("merged_dataset")
        iteration_dataset = validated_data.get("iteration_dataset")
        column_order = validated_data.get("column_order")
        geotag_image_file = validated_data.get("geotag_image_file")
        dataset_type = (
            DatasetType.MERGED_DATASET.value
            if merged_dataset
            else DatasetType.ITERATION_DATASET.value
        )

        is_utm = True if geotag_horizontal_crs.srid != EPSG.WGS84.value else False

        geotag_df = generate_geotag_df_from_csv(
            geotag_image_file=geotag_image_file,
            column_order=column_order,
            dataset_type=dataset_type,
            iteration_dataset=iteration_dataset,
            merged_dataset=merged_dataset,
            is_utm=is_utm,
            geotag_horizontal_crs_srid=geotag_horizontal_crs.srid,
        )

        updated_geotag_df = existing_geotag_image_handler(
            geotag_df=geotag_df,
            merged_dataset=merged_dataset,
            dataset_type=dataset_type,
            iteration_dataset=iteration_dataset,
        )

        csv_mem_buffer = generate_in_mem_buffer(geotag_df=updated_geotag_df)
        geotag_file_headers = ",".join(geotag_df.columns.tolist())

        if dataset_type == DatasetType.MERGED_DATASET.value:
            GeotagImage.objects.filter(merged_dataset=merged_dataset).delete()
        if dataset_type == DatasetType.ITERATION_DATASET.value:
            GeotagImage.objects.filter(iteration_dataset=iteration_dataset).delete()

        copy_from_csv_buffer(
            table_name="processing_workflow_manager_geotagimage",
            columns=geotag_file_headers,
            in_mem_buffer=csv_mem_buffer,
        )

        if dataset_type == DatasetType.MERGED_DATASET.value:
            merged_dataset.geotag_horizontal_crs = geotag_horizontal_crs
            merged_dataset.geotag_vertical_crs = geotag_vertical_crs
            merged_dataset.geotag_rotation_angle = geotag_rotation_angle
            merged_dataset.number_of_images = GeotagImage.objects.filter(
                merged_dataset=merged_dataset.id, is_image_available=True
            ).count()
            merged_dataset.geotag_column_order = column_order[1:]
            merged_dataset.save()

        if dataset_type == DatasetType.ITERATION_DATASET.value:
            if exif_extractor_job_id := iteration_dataset.exif_extractor_job_id:
                AwsManager.terminate_batch_job(
                    str(exif_extractor_job_id), reason="User uploaded geotags."
                )

            images_count = GeotagImage.objects.get_images_counts(
                iteration_dataset=iteration_dataset
            )
            iteration_dataset.number_of_images = images_count["total_images"]
            iteration_dataset.number_of_images_enabled = images_count["enabled_images"]
            iteration_dataset.geotag_horizontal_crs = geotag_horizontal_crs
            iteration_dataset.geotag_vertical_crs = geotag_vertical_crs
            iteration_dataset.rotation_angle_type = geotag_rotation_angle
            iteration_dataset.geotag_column_order = column_order[1:]
            iteration_dataset.preparing_geotags = False
            iteration_dataset.are_geotags_present = True
            iteration_dataset.save()

        response_data = {
            "message": "geotag_image_list_created_successfully",
            "data": images_count,
        }
        return Response(response_data, status=status.HTTP_201_CREATED)

    def list(self, request):
        # TODO: Refactor serializer intialization and permissions check.
        # TODO: Move data fetching logic inside serializer.
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

        query_param_serializer = GeotagImageListQueryParamsSerializer(data=request.GET)
        query_param_serializer.is_valid(raise_exception=True)
        validated_query_params = query_param_serializer.validated_data
        search = validated_query_params.get("search")
        images_with_geotags = validated_query_params.get("images_with_geotags", False)
        images_without_geotags = validated_query_params.get(
            "images_without_geotags", False
        )
        geotags_without_images = validated_query_params.get(
            "geotags_without_images", False
        )
        page_number = validated_query_params.get("page_number", 0)
        page_size = validated_query_params.get("page_size", 50)
        filter_conditions = {}
        if iteration_dataset := validated_query_params.get("iteration_dataset"):
            if iteration_dataset.geotag_horizontal_crs:
                iteration_dataset.geotag_horizontal_crs.srid
            filter_conditions["iteration_dataset"] = iteration_dataset
        elif merged_dataset := validated_query_params.get("merged_dataset"):
            if merged_dataset.geotag_horizontal_crs:
                merged_dataset.geotag_horizontal_crs.srid
            filter_conditions["merged_dataset"] = merged_dataset

        if search:
            filter_conditions["filename__icontains"] = search

        geotag_image_queryset = GeotagImage.objects.filter(
            **filter_conditions
        ).order_by("filename")

        geotag_image_q_filter = combined_geotag_image_q_filter(
            images_without_geotags=images_without_geotags,
            images_with_geotags=images_with_geotags,
            geotags_without_images=geotags_without_images,
        )

        filtered_geotag_image_queryset = geotag_image_queryset.filter(
            geotag_image_q_filter
        )

        paginator = Paginator(filtered_geotag_image_queryset, page_size)
        geotag_image_total_count = paginator.count

        try:
            page = paginator.page(page_number + 1)
        except InvalidPage:
            return Response(
                {"message": "invalid_page_specified"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = GeotagImageSerializer(page, many=True)

        geotag_image_data = {
            "geotag_images": serializer.data,
            "total": geotag_image_total_count,
        }

        response_data = {
            "message": "geotag_image_list_fetched_successfully",
            "data": geotag_image_data,
        }
        return Response(response_data, status=status.HTTP_200_OK)

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
        serializer = GeotagImageDownloadParamsSerializer(data=request.GET)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        geotag_column_order_list = validated_data.get("geotag_column_order")
        geotags_data = parent_dataset.geotagimages.values(
            "filename",
            *geotag_column_order_list,
        ).order_by("filename")

        df = pd.DataFrame.from_records(geotags_data)

        if not df.empty:
            for key in geotag_column_order_list:
                df[key] = df[key].apply(
                    lambda x: x.normalize() if isinstance(x, Decimal) else x
                )

        buffer = io.BytesIO()
        df.to_csv(buffer, index=False, header=False)
        buffer.seek(0)
        file_name = "geotags.txt"
        response = HttpResponse(
            buffer,
            content_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={file_name}"},
        )
        return response

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

        serializer = GeotagImageBulkUpdateSerializer(
            data=request.data, context={"parent_dataset": parent_dataset}
        )
        serializer.is_valid(raise_exception=True)

        geotag_images = serializer.update(
            instance=parent_dataset.geotagimages.all(),
            validated_data=serializer.validated_data,
        )

        output_serializer = GeotagImageSerializer(geotag_images, many=True)
        response = {
            "message": "geotag_images_updated_successfully",
            "data": {
                "geotag_images": output_serializer.data,
                "total": len(geotag_images),
            },
        }
        return Response(response)

    def partial_update(self, request, pk):
        geotag_image_to_update = get_object_or_404(GeotagImage, id=pk)

        parent_dataset = (
            geotag_image_to_update.iteration_dataset
            or geotag_image_to_update.merged_dataset
        )
        site = getattr(parent_dataset, "iteration", parent_dataset).site
        self.check_object_permissions(self.request, site)

        parent_srid = parent_dataset.geotag_horizontal_crs.srid

        update_serializer = GeotagImageUpdateSerializer(
            geotag_image_to_update,
            data=request.data,
            partial=True,
            context={
                "parent_srid": parent_srid,
            },
        )

        update_serializer.is_valid(raise_exception=True)
        update_serializer.save()

        response = {
            "message": "geotag_image_updated_successfully",
            "data": {"geotag_image": update_serializer.data},
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

        bulk_delete_serializer = GeotagImageBulkDeleteSerializer(data=request.data)
        bulk_delete_serializer.is_valid(raise_exception=True)
        bulk_delete_serializer.bulk_delete(
            instances=parent_dataset.geotagimages.all(),
            validated_data=bulk_delete_serializer.validated_data,
        )

        if parent_dataset.geotagimages.all().count() == 0:
            parent_dataset.are_geotags_present = False
            parent_dataset.number_of_images = parent_dataset.geotagimages.filter(
                is_image_available=True
            ).count()
            parent_dataset.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, url_path="presigned-url", url_name="presigned-url")
    def presigned_url(self, request, pk):
        geotag_image = get_object_or_404(GeotagImage, id=pk)

        parent_dataset = geotag_image.iteration_dataset or geotag_image.merged_dataset
        site = getattr(parent_dataset, "iteration", parent_dataset).site
        self.check_object_permissions(self.request, site)

        geotag_image_signed_url = AwsManager.get_download_signed_url(
            geotag_image.iteration_dataset.image_folder_path.bucket_name,
            geotag_image.iteration_dataset.image_folder_path.s3_key
            + geotag_image.filename,
            geotag_image.filename,
        )
        response_data = {
            "message": "geotag_image_list_fetched_successfully",
            "data": {"presigned_url": geotag_image_signed_url},
        }
        return Response(response_data, status=status.HTTP_200_OK)
