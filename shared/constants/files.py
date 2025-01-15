from enum import Enum
from typing import List

from django.utils.functional import classproperty

from .enums import BaseEnum
from .enums import (
    Status as FileStatus,  # NOQA | TODO: Use "Status" consistently. Remove this import once all "FileStatus" references have been replaced with "Status".
)


class FileType(BaseEnum):
    ALL_OUTPUTS = "all_outputs"
    BASE_DSM = "base_dsm"
    CAPTURED_DSM = "captured_dsm"
    CAPTURED_DSM_COG = "captured_dsm_cog"
    LEGEND_IMAGE = "legend_image"
    MBTiles = "mbtiles"
    IMAGES_FOLDER = "images_folder"
    ORG_LOGO = "organisation_logo"
    ORTHOMOSAIC = "orthomosaic"
    ORTHOMOSAIC_COG = "orthomosaic_cog"
    ORTHO_TILES = "ortho_tiles"
    SLOPE_MAP = "slope_map"
    TERRAIN_TILES = "terrain_tiles"
    VECTOR_TILES = "vector_tiles"
    VECTORS = "vectors"
    POINT_CLOUD = "point_cloud"
    REPORT = "report"
    PROJECT_FILE = "project_file"
    OUTPUTS_FOLDER = "outputs_folder"

    """
    The file type for files stored temporarily in a container,
    which distinguishes them from other files when querying the DB.
    """
    TEMPORARY = "temporary"

    @classproperty
    def GENERATABLE_FILE_TYPES(cls) -> List[str]:
        return [
            cls.CAPTURED_DSM_COG.value,
            cls.ORTHOMOSAIC_COG.value,
            cls.SLOPE_MAP.value,
            cls.TERRAIN_TILES.value,
            cls.VECTOR_TILES.value,
            cls.VECTORS.value,
        ]

    @classproperty
    def USER_DELETABLE_FILE_TYPES(cls) -> List[str]:
        return [
            cls.BASE_DSM.value,
            cls.CAPTURED_DSM.value,
            cls.LEGEND_IMAGE.value,
            cls.MBTiles.value,
            cls.ORG_LOGO.value,
            cls.ORTHOMOSAIC.value,
        ]

    @classmethod
    def uploadable_choices(cls):
        return [
            (key.value, key.name)
            for key in cls
            if key.value not in cls.GENERATABLE_FILE_TYPES
        ]


# TODO: Delete after moving DSM to layer.
class BatchJobStatus(BaseEnum):
    PENDING = "pending"
    STARTED = "started"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class FileError(Enum):
    SOMETHING_WENT_WRONG = "Something went wrong."
    SHAPEFILE_NOT_FOUND_IN_ZIP = "The uploaded ZIP file does not contain the shapefile."
    CRS_NOT_FOUND_IN_VECTOR_FILE = "Uploaded vector file does not have a CRS. Please set a CRS for the file and re-upload it."
    FAILED_TO_GENERATE_OUTPUT = "Failed to generate the output."

    @classmethod
    def validate_slug(cls, value: str):
        if value not in cls.keys():
            raise ValueError("Invalid slug")

    @classmethod
    def choices(cls):
        return [(key.name, key.name) for key in cls]
