import os
import tempfile

import numpy as np
from osgeo import gdal

from ..shared import logger
from ..shared.api_engine_manager import Status
from ..shared.helpers import create_dsm_geotiff, get_raster_info, update_status
from ..shared.resources import AwsManager
from ..shared.resources.whitebox_tools import resample_to_lower_resolution
from .schemas import SubtractDsmPayload


def subtract_dsm(data: SubtractDsmPayload):
    # Temp folders.
    TEMP_FILE_DIR = tempfile.TemporaryDirectory()
    RESAMPLED_DSM_PATH = TEMP_FILE_DIR.name + "/resampled_dsm.tif"
    OUTPUT_FILE_PATH = TEMP_FILE_DIR.name + f"/{data.output_dsm_s3_key}"

    # Updating status to processing.
    update_status(status=Status.PROCESSING, url=data.update_status_url)
    first_dsm_path = os.path.join(TEMP_FILE_DIR.name + f"/{data.first_dsm_s3_key}")
    second_dsm_path = os.path.join(TEMP_FILE_DIR.name + f"/{data.second_dsm_s3_key}")

    AwsManager.download_file(data.first_dsm_s3_key, download_path=first_dsm_path)
    AwsManager.download_file(data.second_dsm_s3_key, download_path=second_dsm_path)

    resampled_first_dsm_path, resampled_second_dsm_path = resample_to_lower_resolution(
        first_dsm_path, second_dsm_path, RESAMPLED_DSM_PATH
    )

    # Opening resampled DSMs.
    first_dsm_ds: gdal.Dataset = gdal.Open(resampled_first_dsm_path, gdal.GA_ReadOnly)
    second_dsm_ds: gdal.Dataset = gdal.Open(resampled_second_dsm_path, gdal.GA_ReadOnly)

    first_dsm_info = get_raster_info(first_dsm_ds)
    nodata_value = first_dsm_info["nodata_value"]

    first_dsm_array = first_dsm_ds.ReadAsArray()
    second_dsm_array = second_dsm_ds.ReadAsArray()

    # Subtracting both DSMs.
    logger.info("Subtracting DSM")
    # Not subtracting the cells with nodata value.
    subtracted_dsm_array = np.where(
        np.not_equal(first_dsm_array, nodata_value)
        & np.not_equal(second_dsm_array, nodata_value),
        first_dsm_array - second_dsm_array,
        nodata_value,
    )
    del first_dsm_array
    del second_dsm_array

    # Replacing the elevation value with nodata_value if elevation of that cell lies b/w -threshold_value and threshold value.
    logger.info("Removing data b/w -threshold_value and threshold_value")
    refined_array = np.where(
        (subtracted_dsm_array >= -data.threshold_value)
        & (subtracted_dsm_array <= data.threshold_value),
        nodata_value,
        subtracted_dsm_array,
    )

    del subtracted_dsm_array

    # Creating GeoTiff file of subtracted dsm.
    logger.info("Creating geotiff file of subtracted DSM")
    create_dsm_geotiff(refined_array, OUTPUT_FILE_PATH, first_dsm_info)

    # Uploading file to s3.
    logger.info("Uploading subtracted DSM to s3")
    AwsManager.upload_file(OUTPUT_FILE_PATH, data.output_dsm_s3_key)

    # Updating status to Done.
    update_status(status=Status.DONE, url=data.update_status_url)
