import math

from osgeo import gdal

from ... import logger
from ...helpers import get_raster_info
from .raster_tools import resample_raster


def resample_to_lower_resolution(
    first_raster_path: str,
    second_raster_path: str,
    resampled_raster_temp_path: str,
):
    """
    Downsamples the higher resolution raster to match the lower resolution raster.

    Args:
     - first_raster_path: Path of first raster geotiff file.
     - second_raster_path: Path of second raster geotiff file.
     - resampled_raster_temp_path: A temp file path where the down sampled raster will be stored.
    """

    # Opening both raster in
    first_raster_ds: gdal.Dataset = gdal.Open(first_raster_path, gdal.GA_ReadOnly)
    second_raster_ds: gdal.Dataset = gdal.Open(second_raster_path, gdal.GA_ReadOnly)

    first_raster_info = get_raster_info(first_raster_ds)
    second_raster_info = get_raster_info(second_raster_ds)

    # Calculating area of a cell in both rasters.
    area_of_first_raster_cell = abs(math.prod(first_raster_info["resolution"]))
    area_of_second_raster_cell = abs(math.prod(second_raster_info["resolution"]))

    # HACK: Need to handle the size differences in better way instead of resampling.
    # TODO: Fix in RAIN-3175
    first_dsm_area = abs(math.prod(first_raster_info["shape"]))
    second_dsm_area = abs(math.prod(second_raster_info["shape"]))

    if (
        area_of_first_raster_cell == area_of_second_raster_cell
        and first_dsm_area == second_dsm_area
    ):
        logger.info("Resolution of both rasters are same")
        final_first_raster_path = first_raster_path
        final_second_raster_path = second_raster_path

    # lower the area of pixel means higher the resolution.
    elif (
        area_of_first_raster_cell > area_of_second_raster_cell
        # HACK: Fix in RAIN-3175
        or first_dsm_area > second_dsm_area
    ):
        logger.info("Down sampling the second raster")
        resample_raster(
            second_raster_path,
            resampled_raster_temp_path,
            first_raster_path,
        )

        final_first_raster_path = first_raster_path
        final_second_raster_path = resampled_raster_temp_path

    else:
        logger.info("Down sampling the first raster")
        resample_raster(
            first_raster_path,
            resampled_raster_temp_path,
            second_raster_path,
        )

        final_first_raster_path = resampled_raster_temp_path
        final_second_raster_path = second_raster_path

    return final_first_raster_path, final_second_raster_path
