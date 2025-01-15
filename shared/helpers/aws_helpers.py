from typing import List, Optional, Tuple

from rainbow import logger
from rainbow.env_variables import EnvVariable

from ..aws import AwsManager
from ..constants import FileStatus
from ..models import FileInfo, ImageInfo


def start_uploading_file(
    *,
    key: str,
    filename: str,
    filetype: str,
    file_info: FileInfo = None,
    create_file_info: bool = True,
    bucket_name: Optional[str] = EnvVariable.BUCKET_NAME.value,
) -> Tuple[FileInfo, str]:
    # Create a file_info instance when you are making file_info
    # instance indirectly (i.e from site or iteration), otherwise don't.
    if create_file_info:
        file_info = file_info or FileInfo()
        file_info.name = filename
    file_info.s3_key = key
    file_info.type = filetype
    file_info.status = FileStatus.STARTED.value
    response = AwsManager.multipart_upload(bucket_name=bucket_name, key=key)
    file_info.save()
    return file_info, response["UploadId"]


def get_presigned_url(bucket_name: str, key: str, upload_id: str, part_number: int):
    signed_url = AwsManager.get_upload_signed_url(
        bucket_name,
        key,
        upload_id,
        part_number,
    )
    return signed_url


def complete_multipart_upload(file_info: FileInfo, parts: List, upload_id: str):
    result = False
    if len(parts) > 0:
        try:
            AwsManager.complete_multipart(
                file_info.bucket_name,
                file_info.s3_key,
                parts,
                upload_id,
            )
            file_info.status = FileStatus.DONE.value
            file_info.save()
            result = True
        except Exception:
            AwsManager.abort_multipart(
                file_info.bucket_name, file_info.s3_key, upload_id
            )
            file_info.status = FileStatus.FAILED.value
            file_info.save()
    else:
        AwsManager.abort_multipart(file_info.bucket_name, file_info.s3_key, upload_id)
        file_info.status = FileStatus.FAILED.value
        file_info.save()
    return result


def delete_file_from_s3(file_info: FileInfo) -> bool:
    try:
        AwsManager.delete_file(file_info.bucket_name, file_info.s3_key)
        file_info.delete()
        return True
    except Exception as e:
        logger.exception(e)
        return False


def get_download_url(file_info: FileInfo):
    download_url = AwsManager.get_download_signed_url(
        file_info.bucket_name, file_info.s3_key, file_info.name
    )
    return download_url


def get_file_size(file_info: FileInfo):
    file_size = AwsManager.get_object_size(file_info.bucket_name, file_info.s3_key)
    return file_size


def does_file_exist_in_s3(file_info: FileInfo) -> bool:
    if not file_info.s3_key:
        return False
    return AwsManager.does_file_exist(file_info.bucket_name, file_info.s3_key)


def create_s3_file_key(file_type: str, file_name: str) -> str:
    """
    The function `create_s3_file_key` takes a file type and file name as input and returns a string
    representing the S3 file key.
    """
    return f"{file_type}/{str(file_name)}"


def upload_file(file_info: FileInfo, file) -> FileInfo:
    is_uploaded = AwsManager.upload_file(file_info.bucket_name, file_info.s3_key, file)

    if is_uploaded:
        file_info.status = FileStatus.DONE.value
    else:
        file_info.status = FileStatus.FAILED.value

    file_info.save(update_fields=["status"])

    return file_info


def upload_image(image_info: ImageInfo, image, thumbnail) -> ImageInfo:
    is_image_uploaded = AwsManager.upload_file(
        image_info.bucket_name, image_info.image_s3_key, image
    )

    is_thumbnail_uploaded = AwsManager.upload_file(
        image_info.bucket_name, image_info.thumbnail_s3_key, thumbnail
    )

    # If any of the file (image and thumbnail) fails to upload, return None.
    if not (is_image_uploaded and is_thumbnail_uploaded):
        return None

    return image_info


def get_thumbnail_download_url(image_info: ImageInfo):
    if image_info.thumbnail_s3_key is not None:
        return AwsManager.get_download_signed_url(
            image_info.bucket_name,
            image_info.thumbnail_s3_key,
            image_info.name,
        )
    return None


def get_image_download_url(image_info: ImageInfo):
    if image_info.image_s3_key is not None:
        return AwsManager.get_download_signed_url(
            image_info.bucket_name,
            image_info.image_s3_key,
            image_info.name,
        )
    return None
