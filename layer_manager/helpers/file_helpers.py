import time
from uuid import uuid4

from org_manager.models import Organisation
from shared.constants import FileStatus, FileType
from shared.helpers import create_s3_file_key, slugify
from shared.models import FileInfo

from ..constants import LayerFileFormat


def prepare_layer_file_info(
    *,
    file_format: LayerFileFormat,
    filetype: FileType,
    org: Organisation,
    filename_prefix: str | None = None,
    status: FileStatus | None = FileStatus.STARTED,
    filename: str | None = None,
) -> FileInfo:
    """
    This function prepares and creates a FileInfo object with a unique ID, filename, and S3 key
    based on input parameters.
    """
    file_info_id = uuid4()
    if not filename and filename_prefix:
        filename = "{}_{}.{}".format(
            slugify(filename_prefix),
            time.strftime("%d-%m-%Y"),
            file_format.value,
        )
    elif (filename and filename_prefix) or not (filename or filename_prefix):
        raise ValueError(
            "Anyone is required to provide either a filename or a filename prefix"
        )

    s3_key = create_s3_file_key(
        filetype.value, f"{str(file_info_id)}.{file_format.value}"
    )
    return FileInfo.objects.create(
        id=file_info_id,
        name=filename,
        type=filetype.value,
        s3_key=s3_key,
        org=org,
        status=status.value,
    )
