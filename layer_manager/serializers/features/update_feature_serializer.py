import os
import shutil
import tempfile

from django.core.validators import FileExtensionValidator
from rest_framework import serializers

from shared.exception_handling import ValidationErrors

from ...models import Feature, FeatureImage
from .feature_image_serializer import (
    CreateFeatureImageSerializer,
    FeatureImageSerializer,
)


class UpdateFeatureInfoSerializer(serializers.ModelSerializer):
    info = serializers.CharField(required=False)
    image_list = serializers.ListField(
        child=serializers.ImageField(
            validators=[FileExtensionValidator(["jpeg", "jpg", "png"])]
        ),
        write_only=True,
        required=False,
    )
    images = FeatureImageSerializer(many=True, read_only=True)
    existing_feature_image_count = serializers.IntegerField(write_only=True)

    class Meta:
        model = Feature
        fields = (
            "id",
            "image_list",
            "info",
            "images",
            "existing_feature_image_count",
        )

    def validate(self, data):
        data = super().validate(data)
        if data.get("image_list"):
            image_count = len(data["image_list"])
            existing_feature_image_count = data.pop(
                "existing_feature_image_count", None
            )
            if image_count and existing_feature_image_count + image_count > 3:
                raise serializers.ValidationError(
                    ValidationErrors.IMAGE_PAYLOAD_SIZE_EXCEEDED_ALREADY_EXISTING_IMAGES.value
                )
        return data

    def update(self, feature: Feature, validated_data):
        feature.info = validated_data.get("info", feature.info)
        image_list = validated_data.get(
            "image_list",
        )
        feature.save()

        image_name_list = []

        if image_list:
            # Creating temporary directory to store images.
            temp_dir = tempfile.mkdtemp()
            for image in image_list:
                # Joining temp directory path with our image name to access it later.
                temp_file_path = os.path.join(temp_dir, str(image))
                image_name_list.append(str(image))

                # Adding images to temporary directory.
                with open(temp_file_path, "wb") as destination:
                    shutil.copyfileobj(image, destination)

            feature_image_serializer = CreateFeatureImageSerializer(
                data={"feature": feature.id},
                context={
                    "image_name_list": image_name_list,
                    "temp_dir": temp_dir,
                },
            )
            if feature_image_serializer.is_valid(raise_exception=True):
                feature_image_serializer.save()

            # Removing temporary directory.
            shutil.rmtree(temp_dir)

        feature_data = FeatureImage.objects.select_related("image").filter(
            feature=feature
        )

        return {
            "id": feature.id,
            "info": feature.info,
            "images": list(feature_data),
        }
