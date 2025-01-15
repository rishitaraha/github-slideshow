from rest_framework.serializers import (
    BooleanField,
    DecimalField,
    ModelSerializer,
    PrimaryKeyRelatedField,
    Serializer,
    SerializerMethodField,
    UUIDField,
    ValidationError,
)

from shared.aws import AwsManager
from shared.exception_handling.api_errors import ValidationErrors
from shared.models import FileInfo

from ..constants import GCPImageTagType
from ..models import GCP, GCPImageTag, GeotagImage


class GCPImageTagDataSerializer(Serializer):
    image_id = UUIDField()
    image_x = DecimalField(max_digits=6, decimal_places=2)
    image_y = DecimalField(max_digits=6, decimal_places=2)
    is_deleted = BooleanField(default=False)


class GCPImageTagSerializer(Serializer):
    gcp = PrimaryKeyRelatedField(
        queryset=GCP.objects.all().select_related(
            "iteration_dataset__iteration__site", "merged_dataset__site"
        )
    )
    gcp_image_tags = GCPImageTagDataSerializer(many=True)

    def validate(self, data):
        geotag_image_ids = [
            image_tag["image_id"] for image_tag in data["gcp_image_tags"]
        ]
        if len(geotag_image_ids) != len(set(geotag_image_ids)):
            raise ValidationError(ValidationErrors.DUPLICATE_GCP_IMAGE_TAGS.value)

        gcp = data["gcp"]
        dataset_filter = {}
        if iteration_dataset := gcp.iteration_dataset:
            dataset_filter["iteration_dataset"] = iteration_dataset
        elif merged_dataset := gcp.merged_dataset:
            dataset_filter["merged_dataset"] = merged_dataset

        geotags_not_in_dataset = GeotagImage.objects.filter(
            id__in=geotag_image_ids
        ).exclude(**dataset_filter)

        if geotags_not_in_dataset.exists():
            raise ValidationError(ValidationErrors.INVALID_IMAGE_TO_TAG.value)

        return super().validate(data)

    def update_gcp_image_tags(self, image_info: FileInfo) -> list:
        gcp = self.validated_data["gcp"]
        gcp_image_tags = self.validated_data["gcp_image_tags"]
        gcp_image_tags_to_update = [
            GCPImageTag(
                gcp=gcp,
                geotag_image_id=image_tag["image_id"],
                image_x=image_tag["image_x"],
                image_y=image_tag["image_y"],
            )
            for image_tag in gcp_image_tags
            if not image_tag["is_deleted"]
        ]

        gcp_image_tags_to_delete = [
            image_tag["image_id"]
            for image_tag in gcp_image_tags
            if image_tag["is_deleted"]
        ]
        GCPImageTag.objects.filter(
            gcp=gcp, geotag_image_id__in=gcp_image_tags_to_delete
        ).delete()
        updated_gcp_image_tags = GCPImageTag.objects.bulk_create(
            gcp_image_tags_to_update,
            update_conflicts=True,
            update_fields=("image_x", "image_y"),
            unique_fields=("gcp", "geotag_image"),
        )

        is_gcp_tagged = len(gcp_image_tags) > 0
        gcp_parent_dataset = gcp.iteration_dataset or gcp.merged_dataset
        gcp_parent_dataset.is_gcp_tagged = is_gcp_tagged
        gcp_parent_dataset.save()

        result = []
        for gcp_image_tag in updated_gcp_image_tags:
            presigned_url = AwsManager.get_download_signed_url(
                bucket_name=image_info.bucket_name,
                key=image_info.s3_key + gcp_image_tag.geotag_image.filename,
                file_name=gcp_image_tag.geotag_image.filename,
            )
            geotag_data = {
                "image_id": gcp_image_tag.geotag_image.id,
                "image_filename": gcp_image_tag.geotag_image.filename,
                "image_orientation": gcp_image_tag.geotag_image.image_orientation,
                "presigned_url": presigned_url,
                "image_x": gcp_image_tag.image_x,
                "image_y": gcp_image_tag.image_y,
                "tag_type": GCPImageTagType.TAGGED.value,
            }
            result.append(geotag_data)

        return result


class RetrieveGCPImageTagSerializerForMetashape(ModelSerializer):
    image_x = DecimalField(max_digits=19, decimal_places=10)
    image_y = DecimalField(max_digits=19, decimal_places=10)
    gcp_label = SerializerMethodField("get_gcp_label")
    image_name = SerializerMethodField("get_image_name")
    type = SerializerMethodField("get_type")

    def get_type(self, obj):
        return obj.gcp.type

    def get_gcp_label(self, obj):
        return obj.gcp.label

    def get_image_name(self, obj):
        return obj.geotag_image.name

    class Meta:
        model = GCPImageTag
        fields = [
            "image_id",
            "image_x",
            "image_y",
            "gcp_label",
            "type",
            "image_name",
        ]


class ApproximateTaggedGeotagImagesSerializer(Serializer):
    task_geotag_id = UUIDField()
    image_x = DecimalField(max_digits=19, decimal_places=10)
    image_y = DecimalField(max_digits=19, decimal_places=10)


class ApproximateGCPImageTagsWithTaskGCPIdSerializer(Serializer):
    task_gcp_id = UUIDField()
    approx_gcp_image_tags = ApproximateTaggedGeotagImagesSerializer(many=True)
