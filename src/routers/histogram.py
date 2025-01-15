import numpy as np
from fastapi import Request, Response, status
from rasterio import RasterioIOError
from rio_tiler.colormap import cmap as colormap
from rio_tiler.errors import TileOutsideBounds
from rio_tiler.io import COGReader
from rio_tiler.profiles import img_profiles
from rio_tiler.utils import linear_rescale, render

from ..exceptions import ApiErrors, GeneralException
from ..shared import logger


async def cog_histogram_tile_view(
    request: Request,
    z: int,
    x: int,
    y: int,
    rescale: str,
    key: str,
):
    try:
        # Rescale array for input range.
        rescale_arr = list(map(float, rescale.split(",")))
    except:
        raise GeneralException(
            ApiErrors.INVALID_RESCALE_VALUE.value, status.HTTP_400_BAD_REQUEST
        )

    if len(rescale_arr) != 2:
        raise GeneralException(
            ApiErrors.INVALID_RESCALE_VALUE.value, status.HTTP_400_BAD_REQUEST
        )

    cog_url = f"s3://{key}"

    try:
        with COGReader(cog_url) as cog:
            img = cog.tile(
                x,
                y,
                z,
            )

    except TileOutsideBounds:
        raise GeneralException(
            ApiErrors.TILE_OUTSIDE_BOUND.value, status.HTTP_404_NOT_FOUND
        )

    except RasterioIOError as exception:
        logger.debug(exception)
        raise GeneralException(
            ApiErrors.TILE_NOT_FOUND.value, status.HTTP_404_NOT_FOUND
        )

    except Exception as exception:
        logger.exception(exception)
        raise GeneralException(
            ApiErrors.TILE_NOT_FOUND.value, status.HTTP_404_NOT_FOUND
        )

    # There must be only one band in the source data to create a histogram.
    if img.count != 1:
        raise GeneralException(
            ApiErrors.INVALID_HISTOGRAM_SOURCE_DATA_BAND.value,
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    options = img_profiles.get("png", {})

    # Create a mask to remove values that lie outside of the rescale array.
    # Mask will work as an alpha channel for image value.
    image_threshold_mask = np.ma.masked_outside(
        img.data, rescale_arr[0], rescale_arr[1]
    )

    # Rescale mask with transparency values (0,255).
    image_threshold_mask_filled_with_alpha_values = linear_rescale(
        # Reduce all masked values to lowest values.
        image_threshold_mask.filled(rescale_arr[0])[0],
        in_range=(rescale_arr[0], rescale_arr[1]),
    )

    # Set alpha value to highest (255) if it is greater than 0.
    image_threshold_mask_filled_with_alpha_values[
        image_threshold_mask_filled_with_alpha_values > 0
    ] = 255

    # Rescale image elevation value to RGB value (0,255) for each band.
    rescaled_img = img.post_process(in_range=(rescale_arr,))

    content = render(
        rescaled_img.data,
        image_threshold_mask_filled_with_alpha_values.astype(np.uint8),
        img_format="PNG",
        colormap=colormap.get("viridis"),
        **options,
    )

    return Response(content, media_type="image/png")
