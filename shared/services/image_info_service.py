from rest_framework import exceptions

from rainbow import logger
from shared.aws import AwsManager

from ..models import ImageInfo


class ImageInfoService:
    @classmethod
    def delete_image_info(self, image_info: ImageInfo = None):
        try:
            AwsManager.delete_file(image_info.bucket_name, image_info.image_s3_key)
            AwsManager.delete_file(image_info.bucket_name, image_info.thumbnail_s3_key)
            image_info.delete()

        except Exception as exc:
            logger.exception(exc)
            raise exceptions.server_error()
