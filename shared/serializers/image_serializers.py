import os

from rest_framework import serializers, status

from shared.exception_handling import FileUploadFailedException
from shared.exception_handling.api_errors import ApiErrors, ValidationErrors
from shared.helpers import (
    create_s3_file_key,
    get_image_download_url,
    get_thumbnail_download_url,
    resize_image,
    upload_image,
)

from ..models import ImageInfo


class ImageInfoSerializer(serializers.ModelSerializer):
    image_s3_key = serializers.SerializerMethodField()
    thumbnail_s3_key = serializers.SerializerMethodField()

    def get_image_s3_key(self, image: ImageInfo):
        return get_image_download_url(image)

    def get_thumbnail_s3_key(self, image: ImageInfo):
        return get_thumbnail_download_url(image)

    class Meta:
        model = ImageInfo
        fields = ["id", "name", "image_s3_key", "thumbnail_s3_key"]


class UploadImageSerializer(serializers.Serializer):
    images = serializers.ListSerializer(child=ImageInfoSerializer(), read_only=True)

    class Meta:
        model = ImageInfo
        fields = ["images"]

    def validate(self, data):
        if len(self.context["image_name_list"]) > 3:
            raise serializers.ValidationError(
                ValidationErrors.EXCEEDED_IMAGE_UPLOAD_LIMIT.value
            )

        return super().validate(data)

    def create(self, _):
        image_info_list = []

        for image_name in self.context["image_name_list"]:
            image_path = os.path.join(self.context["temp_dir"], image_name)
            with open(image_path, "rb") as file:
                image = file.read()

                # Resizing thumbnail.
                thumbnail_output_size = (300, 300)
                thumbnail = resize_image(image_path, thumbnail_output_size)

                image_info = ImageInfo()
                thumbnail_s3_key = create_s3_file_key(
                    "thumbnail", f"{image_info.id}.jpeg"
                )
                image_s3_key = create_s3_file_key("image", f"{image_info.id}.jpeg")

                image_info.image_s3_key = image_s3_key
                image_info.thumbnail_s3_key = thumbnail_s3_key
                image_info.name = image_name

                is_image_uploaded = upload_image(image_info, image, thumbnail)

                if not is_image_uploaded:
                    # Delete the object if the image upload fails.
                    image_info.delete()
                    api_error_obj = ApiErrors.IMAGE_UPLOAD_FAILED.value
                    api_error_obj.message = (
                        f"Image upload failed for {', '.join(image_info.name)}"
                    )

                    raise FileUploadFailedException(
                        api_error_obj, code=status.HTTP_422_UNPROCESSABLE_ENTITY
                    )
                else:
                    image_info.save()
                    image_info_list.append(image_info)

        return {"images": image_info_list}
