from typing import List

from ..constants import FileStatus, FileType
from ..models import FileInfo
from .cog_helpers import get_cog_metadata


def get_or_update_cog_file_properties(file_info: FileInfo):
    """
    Returns file_info.properties if it is already present in the database.
    Otherwise if it is a COG file, extracts metadata from the file and updates database.
    """

    COG_FILE_TYPES = [
        FileType.CAPTURED_DSM_COG.value,
        FileType.ORTHOMOSAIC_COG.value,
        FileType.SLOPE_MAP.value,
    ]

    """
    Do not extract metadata if:
    1. File type is not COG.
    2. File type is COG but 'valid' metadata is already present in the database.
    3. File type is COG but file status is not 'done'.
    """
    if (
        file_info.type not in COG_FILE_TYPES
        or (
            file_info.properties
            # Metadata is valid if "statistics", "bounds", "minzoom" and "maxzoom" are present in the properties.
            and set(["statistics", "bounds", "minzoom", "maxzoom"]).issubset(
                set(file_info.properties.keys())
            )
        )
        or file_info.status != FileStatus.DONE.value
    ):
        return file_info.properties

    properties = get_cog_metadata(file_info.s3_uri)
    file_info.properties = properties
    file_info.save(update_fields=["properties"])

    return properties


def get_files_status(files: List[FileInfo]) -> str | None:
    """
    This function takes a list of file_infos and returns the overall status of the layer files.
     - Returns `done` If all file_infos status is `done`.
     - If any of the file has status other then `done` then it will return the status of that file.
    """
    files_per_status = {
        FileStatus.DONE.value: 0,
        FileStatus.FAILED.value: 0,
        FileStatus.IMPORT_FAILED.value: 0,
        FileStatus.IMPORTING.value: 0,
        FileStatus.PROCESSING.value: 0,
        FileStatus.STARTED.value: 0,
    }

    for file in files:
        files_per_status[file.status] += 1

    # Return `done` only if all files have status `done`.
    if files_per_status[FileStatus.DONE.value] == len(files) and len(files) > 0:
        return FileStatus.DONE.value
    elif files_per_status[FileStatus.FAILED.value] > 0:
        return FileStatus.FAILED.value
    elif files_per_status[FileStatus.IMPORT_FAILED.value] > 0:
        return FileStatus.IMPORT_FAILED.value
    elif files_per_status[FileStatus.IMPORTING.value] > 0:
        return FileStatus.IMPORTING.value
    elif files_per_status[FileStatus.STARTED.value] > 0:
        return FileStatus.STARTED.value
    elif files_per_status[FileStatus.PROCESSING.value] > 0:
        return FileStatus.PROCESSING.value
