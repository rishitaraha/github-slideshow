from collections import OrderedDict

from django.contrib.gis.db.backends.postgis.models import PostGISSpatialRefSys
from rest_framework import serializers
from rest_framework.serializers import PrimaryKeyRelatedField

from rainbow import settings
from shared.constants import VerticalCRS
from shared.exception_handling import ValidationErrors

from ..constants import (
    GEOTAG_DATA_FIELDS,
    GeotagImageColumnField,
    GeotagImageEntity,
    GeotagRotationAngle,
)
from ..helpers.geotag_image_helpers import add_location_wgs84_field
from ..models import (
    GeotagImage,
    MergedDataset,
    ProcessingIterationData,
    TaskGeotagImage,
)
from ..serializers import CoordinateValuesNormalized, DatasetQueryParamSerializer


class GeotagImageCreateSerializer(serializers.Serializer):
    merged_dataset = serializers.PrimaryKeyRelatedField(
        queryset=MergedDataset.objects.all(), required=False
    )

    iteration_dataset = serializers.PrimaryKeyRelatedField(
        queryset=ProcessingIterationData.objects.all(), required=False
    )
    geotag_horizontal_crs = serializers.PrimaryKeyRelatedField(
        queryset=PostGISSpatialRefSys.objects.all()
    )
    geotag_vertical_crs = serializers.ChoiceField(choices=VerticalCRS.choices())
    geotag_rotation_angle = serializers.ChoiceField(
        choices=GeotagRotationAngle.choices(), required=False
    )
    column_order = serializers.ListField(
        child=serializers.ChoiceField(choices=GeotagImageColumnField.choices()),
    )
    geotag_image_file = serializers.FileField(allow_empty_file=False)

    def validate(self, data):
        geotag_image_file = data.get("geotag_image_file")
        column_order = data.get("column_order")

        size_in_range = settings.DATA_UPLOAD_MAX_MEMORY_SIZE > geotag_image_file.size
        file_name = geotag_image_file.name

        if not size_in_range:
            raise serializers.ValidationError(
                ValidationErrors.FILE_SIZE_TOO_LARGE.value
            )
        if not file_name.lower().endswith((".txt", ".csv")):
            raise serializers.ValidationError(ValidationErrors.INVALID_FILE_TYPE.value)
        try:
            file_content = geotag_image_file.read().decode("utf-8")

        except UnicodeDecodeError:
            raise serializers.ValidationError(ValidationErrors.INVALID_FILE_DATA.value)

        first_line = file_content.splitlines()[0]
        num_columns_in_file = len(first_line.split(","))
        if len(column_order) != num_columns_in_file:
            raise serializers.ValidationError(
                ValidationErrors.INVALID_GEOTAG_COLUMNS.value
            )
        if column_order[0] != GeotagImageColumnField.FILENAME.value:
            raise serializers.ValidationError(
                ValidationErrors.INVALID_FIRST_COLUMN_FOR_GEOTAG_FILE.value
            )
        geotag_image_file.seek(0)
        return super().validate(data)


class GeotagImageListQueryParamsSerializer(DatasetQueryParamSerializer):
    page_number = serializers.IntegerField(required=False)
    page_size = serializers.IntegerField(required=False)
    search = serializers.CharField(required=False)
    images_with_geotags = serializers.BooleanField(required=False)
    images_without_geotags = serializers.BooleanField(required=False)
    geotags_without_images = serializers.BooleanField(required=False)


class CoordinateValuesNormalized(serializers.DecimalField):
    def to_representation(self, value):
        return value.normalize()


class GeotagImageSerializer(serializers.ModelSerializer):
    x_coordinate = CoordinateValuesNormalized(max_digits=17, decimal_places=10)
    y_coordinate = CoordinateValuesNormalized(max_digits=17, decimal_places=10)
    z_coordinate = CoordinateValuesNormalized(max_digits=17, decimal_places=10)

    class Meta:
        model = GeotagImage
        fields = "__all__"


class GeotagImageDownloadParamsSerializer(serializers.Serializer):
    merged_dataset = PrimaryKeyRelatedField(
        queryset=MergedDataset.objects.all(), required=False
    )
    iteration_dataset = PrimaryKeyRelatedField(
        queryset=ProcessingIterationData.objects.all(), required=False
    )
    geotag_column_order = serializers.ListField(
        child=serializers.CharField(),  # Matches TextField in the model
        required=True,
    )

    def validate(self, data):
        column_order = self.initial_data.getlist("geotag_column_order", None)
        if column_order:
            updated_column_order = []
            for column_type in column_order:
                if not column_type in GeotagImageColumnField.values():
                    raise serializers.ValidationError(
                        ValidationErrors.INVALID_GEOTAG_COLUMNS.value
                    )
                # Define the mapping of column names to replacements
                replacement_mapping = {
                    "latitude": "y_coordinate",
                    "longitude": "x_coordinate",
                    "northing": "y_coordinate",
                    "easting": "x_coordinate",
                    "altitude": "z_coordinate",
                    "latitude_accuracy": "y_accuracy",
                    "longitude_accuracy": "x_accuracy",
                    "northing_accuracy": "y_accuracy",
                    "easting_accuracy": "x_accuracy",
                    "altitude_accuracy": "z_accuracy",
                }
                updated_column_order.append(
                    replacement_mapping.get(column_type, column_type)
                )
            data["geotag_column_order"] = updated_column_order

        return super().validate(data)


# TODO: Use ListSerializer.
class GeotagImageBulkUpdateSerializer(serializers.Serializer):
    merged_dataset = serializers.UUIDField(required=False)
    iteration_dataset = serializers.UUIDField(required=False)
    geotag_image_ids = serializers.ListField(
        child=serializers.UUIDField(), required=True
    )
    is_geotag_disabled = serializers.BooleanField(required=True)
    is_image_disabled = serializers.BooleanField(required=True)

    def validate(self, data):
        parent_dataset = self.context["parent_dataset"]
        geotag_image_ids = data["geotag_image_ids"]

        existing_geotag_image_ids = parent_dataset.geotagimages.values_list(
            "id", flat=True
        )
        invalid_geotag_image_ids = set(geotag_image_ids) - set(
            existing_geotag_image_ids
        )
        if invalid_geotag_image_ids:
            raise serializers.ValidationError(
                {
                    "geotag_image_bulk_update": ValidationErrors.SOME_GEOTAGS_MISSING.value
                }
            )

        return data

    def update(self, instance, validated_data):
        geotag_image_ids = validated_data["geotag_image_ids"]
        is_geotag_disabled = validated_data.get("is_geotag_disabled")
        is_image_disabled = validated_data.get("is_image_disabled")

        geotag_images = instance.filter(id__in=geotag_image_ids)

        geotag_images.update(
            is_geotag_disabled=is_geotag_disabled,
            is_image_disabled=is_image_disabled,
        )

        geotag_images = GeotagImage.objects.filter(id__in=geotag_image_ids)

        return geotag_images


class GeotagImageUpdateSerializer(serializers.ModelSerializer):
    x_coordinate = CoordinateValuesNormalized(
        max_digits=17, decimal_places=10, required=False
    )
    y_coordinate = CoordinateValuesNormalized(
        max_digits=17, decimal_places=10, required=False
    )
    z_coordinate = CoordinateValuesNormalized(
        max_digits=17, decimal_places=10, required=False
    )
    is_geotag_disabled = serializers.BooleanField(required=False)
    is_image_disabled = serializers.BooleanField(required=False)

    def save(self, *args, **kwargs):
        instance = self.instance

        updated_data = self.validated_data

        coordinates = ["x_coordinate", "y_coordinate", "z_coordinate"]

        if any(updated_data.get(coord) for coord in coordinates):
            for coord in coordinates:
                new_value = updated_data.get(coord, getattr(instance, coord))
                setattr(instance, coord, new_value)

            add_location_wgs84_field(
                instance,
                self.context["parent_srid"],
            )

        for field in self.fields:
            if field in updated_data:
                setattr(instance, field, updated_data[field])

        instance.save()

        return instance

    class Meta:
        model = GeotagImage
        fields = [
            "location_wgs84",
            "x_coordinate",
            "y_coordinate",
            "z_coordinate",
            "is_geotag_disabled",
            "is_image_disabled",
        ]


class GeotagImageBulkDeleteSerializer(serializers.Serializer):
    geotag_image_ids = serializers.ListField(
        child=serializers.UUIDField(), min_length=1
    )
    entity = serializers.ChoiceField(choices=GeotagImageEntity.choices())

    def bulk_delete(self, instances, validated_data):
        geotag_image_ids = validated_data["geotag_image_ids"]
        delete_entity = validated_data["entity"]
        existing_geotag_images = instances.filter(id__in=geotag_image_ids)

        if existing_geotag_images.count() != len(geotag_image_ids):
            raise serializers.ValidationError(
                ValidationErrors.SOME_GEOTAGS_MISSING.value
            )

        if delete_entity == GeotagImageEntity.GEOTAG_DATA.value:
            for geotag_image in existing_geotag_images:
                for geotag_field in GEOTAG_DATA_FIELDS:
                    setattr(geotag_image, geotag_field, None)

            GeotagImage.objects.bulk_update(
                existing_geotag_images, fields=GEOTAG_DATA_FIELDS
            )

        if delete_entity in [
            GeotagImageEntity.IMAGE_DATA.value,
            GeotagImageEntity.GEOTAG_IMAGE.value,
        ]:
            for geotag_image in existing_geotag_images:
                geotag_image.is_image_available = False

            GeotagImage.objects.bulk_update(
                existing_geotag_images, fields=["is_image_available"]
            )

            if delete_entity == GeotagImageEntity.GEOTAG_IMAGE.value:
                existing_geotag_images.delete()


class TaskGeotagForProcessingSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        result = super(TaskGeotagForProcessingSerializer, self).to_representation(
            instance
        )
        return OrderedDict(
            [(key, result[key]) for key in result if result[key] is not None]
        )

    class Meta:
        model = TaskGeotagImage
        fields = "__all__"
