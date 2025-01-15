import os

from django.conf import settings
from django.contrib.gis.db.backends.postgis.models import PostGISSpatialRefSys
from psycopg2 import sql
from psycopg2.extensions import AsIs
from rest_framework import serializers

from shared.aws.aws_manager import AwsManager
from shared.constants import VerticalCRS
from shared.exception_handling import ValidationErrors
from shared.models.file_models import FileInfo

from ..constants import (
    COORDINATE_BOUND_MAPPING,
    CoordinateBound,
    GCPColumnField,
    GCPFileUploadAction,
    GCPImageTagType,
    GCPType,
)
from ..helpers import get_gcp_objects_from_file, get_image_orientation_slug_from_exif
from ..models import (
    GCP,
    ApproxGCPImageTag,
    GCPImageTag,
    GeotagImage,
    TaskGCP,
    TaskGCPImageTag,
)
from .general_serializers import CoordinateValuesNormalized, DatasetQueryParamSerializer


class GCPListQueryParamsSerializer(DatasetQueryParamSerializer):
    page_number = serializers.IntegerField(required=False)
    page_size = serializers.IntegerField(required=False)
    search = serializers.CharField(required=False)


class GCPBulkDeleteSerializer(serializers.Serializer):
    gcp_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)

    def bulk_delete(self, instances, validated_data):
        gcp_ids_to_delete = validated_data["gcp_ids"]
        instances.filter(id__in=gcp_ids_to_delete).delete()


class GCPSerializer(serializers.ModelSerializer):
    number_of_images_tagged = serializers.IntegerField(required=False)
    x_coordinate = CoordinateValuesNormalized(max_digits=17, decimal_places=10)
    y_coordinate = CoordinateValuesNormalized(max_digits=17, decimal_places=10)
    z_coordinate = CoordinateValuesNormalized(max_digits=17, decimal_places=10)

    class Meta:
        model = GCP
        fields = "__all__"


class GCPUpdateSerializer(serializers.ModelSerializer):
    def validate(self, data):
        if gcp_type := data.get("type"):
            if gcp_type not in GCPType.values():
                raise serializers.ValidationError(
                    ValidationErrors.INVALID_GCP_TYPE.value
                )

        is_utm = self.context.get("is_utm")
        x_coordinate = data.get("x_coordinate")
        y_coordinate = data.get("y_coordinate")
        z_coordinate = data.get("z_coordinate")

        is_projected_coordinate_mapping = {
            True: (
                GCPColumnField.EASTING.value,
                GCPColumnField.NORTHING.value,
            ),
            False: (
                GCPColumnField.LONGITUDE.value,
                GCPColumnField.LATITUDE.value,
            ),
        }
        x, y = is_projected_coordinate_mapping[is_utm]

        x_coordinate_in_bounds = (
            COORDINATE_BOUND_MAPPING[x][0]
            <= x_coordinate
            <= COORDINATE_BOUND_MAPPING[x][1]
        )
        y_coordinate_in_bounds = (
            COORDINATE_BOUND_MAPPING[y][0]
            <= y_coordinate
            <= COORDINATE_BOUND_MAPPING[y][1]
        )
        z_coordinate_in_bounds = (
            CoordinateBound.ALTITUDE_LOWER_BOUND.value
            <= z_coordinate
            <= CoordinateBound.ALTITUDE_UPPER_BOUND.value
        )

        if not (
            x_coordinate_in_bounds and y_coordinate_in_bounds and z_coordinate_in_bounds
        ):
            raise serializers.ValidationError(
                ValidationErrors.COORDINATES_OUT_OF_BOUNDS.value
            )

        return super().validate(data)

    class Meta:
        model = GCP
        fields = [
            "id",
            "label",
            "type",
            "x_coordinate",
            "y_coordinate",
            "z_coordinate",
        ]


class GCPRecordListSerializer(serializers.ListSerializer):
    def create(self, validated_data):
        gcp_instances = [self.child.Meta.model(**attrs) for attrs in validated_data]
        self.child.Meta.model.objects.bulk_create(gcp_instances)

        return gcp_instances


class GCPFileUploadSerializer(DatasetQueryParamSerializer):
    gcp_file = serializers.FileField(required=True, allow_empty_file=False)
    gcp_horizontal_crs = serializers.PrimaryKeyRelatedField(
        queryset=PostGISSpatialRefSys.objects.all()
    )
    gcp_vertical_crs = serializers.ChoiceField(
        choices=VerticalCRS.choices(), required=True
    )
    action = serializers.ChoiceField(
        choices=GCPFileUploadAction.choices(), required=True
    )

    def validate_gcp_file(self, gcp_file):
        file_name = gcp_file.name
        if not file_name.lower().endswith((".txt", ".csv")):
            raise serializers.ValidationError(
                {"gcp_file": ValidationErrors.INVALID_FILE_TYPE_PROVIDED.value}
            )

        if gcp_file.size > settings.DATA_UPLOAD_MAX_MEMORY_SIZE:
            raise serializers.ValidationError(
                {"gcp_file": ValidationErrors.FILE_SIZE_TOO_LARGE.value}
            )

        return gcp_file

    def get_filter_conditions(self, data):
        return {
            key: value
            for key, value in {
                "iteration_dataset": data.get("iteration_dataset"),
                "merged_dataset": data.get("merged_dataset"),
            }.items()
            if value
        }

    def validate(self, data):
        data = super().validate(data)
        gcp_file = data["gcp_file"]

        filter_conditions = self.get_filter_conditions(data)

        gcp_file = data["gcp_file"].file

        srid = data["gcp_horizontal_crs"].srid

        gcp_objects_to_create = get_gcp_objects_from_file(
            gcp_file=gcp_file, srid=srid, **filter_conditions
        )

        gcp_file.close()

        # Parse file content and validate as a list of GCP records
        if not gcp_objects_to_create:
            raise serializers.ValidationError(
                {"gcp_file": ValidationErrors.EMPTY_FILE.value}
            )

        # Validate parsed records using GCPRecordListSerializer
        # TODO: GCPSerializer can be used directly with many=True.
        gcp_records_list_serializer = GCPRecordListSerializer(
            data=gcp_objects_to_create, child=GCPSerializer()
        )
        gcp_records_list_serializer.is_valid(raise_exception=True)

        # Store validated records in the data to be saved later
        data["gcp_records"] = gcp_records_list_serializer.validated_data
        return super().validate(data)

    def create(self, validated_data):
        data = validated_data.copy()

        filter_conditions = self.get_filter_conditions(validated_data)

        action = data["action"]
        if action == GCPFileUploadAction.REPLACE.value:
            GCP.objects.filter(**filter_conditions).delete()

        # TODO: GCPSerializer can be used directly with many=True.
        gcp_records_list_serializer = GCPRecordListSerializer(
            data=validated_data["gcp_records"], child=GCPSerializer()
        )

        gcps = gcp_records_list_serializer.create(validated_data["gcp_records"])

        parent_object = data.get("iteration_dataset") or data.get("merged_dataset")
        if parent_object:
            parent_object.gcp_horizontal_crs = data["gcp_horizontal_crs"]
            parent_object.gcp_vertical_crs = data["gcp_vertical_crs"]
            parent_object.is_gcp_tagged = False
            parent_object.are_gcps_present = True
            parent_object.save()

        return gcps


class GCPBulkUpdateSerializer(serializers.Serializer):
    merged_dataset = serializers.UUIDField(required=False)
    iteration_dataset = serializers.UUIDField(required=False)
    gcp_ids = serializers.ListField(child=serializers.UUIDField())
    type = serializers.ChoiceField(choices=GCPType.choices())

    def validate(self, data):
        parent_dataset = self.context["parent_dataset"]

        gcp_ids = data["gcp_ids"]
        existing_gcp_ids = parent_dataset.gcps.values_list("id", flat=True)
        invalid_gcp_ids = set(gcp_ids) - set(existing_gcp_ids)
        if invalid_gcp_ids:
            raise serializers.ValidationError(
                {"gcp_bulk_update": ValidationErrors.GCP_NOT_FOUND.value}
            )

        return data

    def update(self, instance, validated_data):
        gcp_ids = validated_data["gcp_ids"]
        type = validated_data.get("type")

        gcps = instance.filter(id__in=gcp_ids)

        gcps.update(type=type)

        gcps = GCP.objects.filter(id__in=gcp_ids)

        return gcps


class GCPImagesSerializer(serializers.Serializer):
    page_number = serializers.IntegerField(min_value=0, default=0)
    page_size = serializers.IntegerField(min_value=1, default=10)
    gcp_srid = serializers.IntegerField()
    geotag_srid = serializers.IntegerField()

    def retrieve_geotag_images_data(self, validated_data) -> list:
        gcp = self.context["gcp"]
        gcp_srid = validated_data["gcp_srid"]
        geotag_srid = validated_data["geotag_srid"]

        tagged_images_map = {
            image_tag.geotag_image_id: image_tag
            for image_tag in GCPImageTag.objects.filter(gcp=gcp)
        }
        tagged_images_query = ", ".join(
            f"'{gcp_tag_id}'" for gcp_tag_id in tagged_images_map.keys()
        )
        tagged_images_condition = (
            f"WHEN id IN ({AsIs(tagged_images_query)}) THEN 1"
            if tagged_images_map
            else ""
        )

        approx_tag_images_map = {
            approx_image_tag.geotag_image_id: approx_image_tag
            for approx_image_tag in ApproxGCPImageTag.objects.filter(gcp=gcp)
        }
        approx_images_query = ", ".join(
            f"'{approx_gcp_tag_id}'"
            for approx_gcp_tag_id in approx_tag_images_map.keys()
        )
        approx_images_condition = (
            f"WHEN id IN ({AsIs(approx_images_query)}) THEN 2"
            if approx_tag_images_map
            else "WHEN id IS NOT NULL THEN 3"
        )

        if iteration_dataset := gcp.iteration_dataset:
            dataset_condition = f"iteration_dataset_id='{iteration_dataset.id}'"
            image_info: FileInfo = iteration_dataset.image_folder_path

        elif merged_dataset := gcp.merged_dataset:
            dataset_condition = f"merged_dataset_id='{merged_dataset.id}'"
            image_info: FileInfo = merged_dataset.input_image_s3_folder_info

        page_size = validated_data["page_size"]
        page_number = validated_data["page_number"]
        page_offset = page_size * page_number

        select_geotag_images_query = sql.SQL(
            """
            SELECT {id_col}, {filename_col}, ST_Distance(
                ST_Transform(ST_SetSRID( ST_MakePoint( {gcp_x_coordinate}, {gcp_y_coordinate}, {gcp_z_coordinate} ), {gcp_srid} ), 4326),
                ST_Transform(ST_SetSRID( ST_MakePoint( {x_coordinate_col}, {y_coordinate_col}, {z_coordinate_col} ), {geotag_srid} ), 4326)
            ) AS {distance_col},
                CASE
                    {tagged_images_condition}
                    {approx_images_condition}
                    ELSE 3
                END AS {tag_type_col}
            FROM {table_name}
            WHERE {dataset_condition} AND {is_image_available}=true
            ORDER BY {tag_type_col}, {distance_col}
            LIMIT {page_size} OFFSET {page_offset};
            """
        ).format(
            table_name=sql.Identifier("processing_workflow_manager_geotagimage"),
            id_col=sql.Identifier("id"),
            filename_col=sql.Identifier("filename"),
            distance_col=sql.Identifier("distance"),
            tag_type_col=sql.Identifier("tag_type"),
            x_coordinate_col=sql.Identifier("x_coordinate"),
            y_coordinate_col=sql.Identifier("y_coordinate"),
            z_coordinate_col=sql.Identifier("z_coordinate"),
            is_image_available=sql.Identifier("is_image_available"),
            tagged_images_condition=sql.SQL(tagged_images_condition),
            approx_images_condition=sql.SQL(approx_images_condition),
            gcp_srid=sql.SQL(str(gcp_srid)),
            geotag_srid=sql.SQL(str(geotag_srid)),
            gcp_x_coordinate=sql.SQL(str(gcp.x_coordinate)),
            gcp_y_coordinate=sql.SQL(str(gcp.y_coordinate)),
            gcp_z_coordinate=sql.SQL(str(gcp.z_coordinate)),
            dataset_condition=sql.SQL(dataset_condition),
            page_size=sql.SQL(str(page_size)),
            page_offset=sql.SQL(str(page_offset)),
        )

        sorted_geotag_images = list(GeotagImage.objects.raw(select_geotag_images_query))

        result_geotag_data = []
        for geotag_image in sorted_geotag_images:
            image_object_key = os.path.join(image_info.s3_key, geotag_image.filename)
            presigned_url = AwsManager.get_download_signed_url(
                bucket_name=image_info.bucket_name,
                key=image_object_key,
                file_name=geotag_image.filename,
            )
            if not geotag_image.image_orientation:
                image_orientation_slug = get_image_orientation_slug_from_exif(
                    image_object_key
                )
                geotag_image.image_orientation = image_orientation_slug
                geotag_image.save()

            geotag_data = {
                "image_id": geotag_image.id,
                "image_filename": geotag_image.filename,
                "image_orientation": geotag_image.image_orientation,
                "presigned_url": presigned_url,
                "tag_type": GCPImageTagType.UNTAGGED.value,
            }

            if tagged_image := tagged_images_map.get(geotag_image.id):
                geotag_data["image_x"] = tagged_image.image_x
                geotag_data["image_y"] = tagged_image.image_y
                geotag_data["tag_type"] = GCPImageTagType.TAGGED.value
            elif approx_tag := approx_tag_images_map.get(geotag_image.id):
                geotag_data["image_x"] = approx_tag.image_x
                geotag_data["image_y"] = approx_tag.image_y
                geotag_data["tag_type"] = GCPImageTagType.APPROX_TAG.value

            result_geotag_data.append(geotag_data)

        return result_geotag_data


class TaskGCPSerializer(serializers.ModelSerializer):
    number_of_images_tagged = serializers.SerializerMethodField()

    def get_number_of_images_tagged(self, obj):
        return obj.taskgcpimagetag_set.count()

    class Meta:
        model = TaskGCP
        fields = "__all__"


class TaskGCPImageTagSerializer(serializers.ModelSerializer):
    gcp_label = serializers.CharField(source="task_gcp.label")
    type = serializers.CharField(source="task_gcp.type")
    image_name = serializers.CharField(source="task_geotag_image.filename")

    class Meta:
        model = TaskGCPImageTag
        fields = [
            "gcp_label",
            "image_name",
            "image_x",
            "image_y",
            "type",
        ]
