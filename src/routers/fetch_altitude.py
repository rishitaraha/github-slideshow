from fastapi import Request, status
from rasterio import RasterioIOError
from rio_tiler.errors import PointOutsideBounds
from rio_tiler.io import COGReader

from ..exceptions import ApiErrors, GeneralException
from ..shared import logger


async def get_altitude_view(
    request: Request,
    longitude: float,
    latitude: float,
    key: str,
):
    cog_url = f"s3://{key}"

    try:
        with COGReader(cog_url) as cog:
            point_value = cog.point(longitude, latitude).data
            logger.debug(point_value)
            if point_value[0] == -32767:
                return {"data": -1}
            else:
                return {"data": point_value.tolist()}

    except PointOutsideBounds:
        raise GeneralException(
            ApiErrors.POINT_OUTSIDE_DATASET_BOUNDS.value, status.HTTP_400_BAD_REQUEST
        )

    except RasterioIOError as exception:
        logger.error("Rasterio IOError:")
        logger.exception(exception)
        raise GeneralException(
            ApiErrors.SOMETHING_WENT_WRONG.value, status.HTTP_400_BAD_REQUEST
        )

    except Exception as exception:
        logger.error("Metadata Cog reader failed:")
        logger.exception(exception)
        raise GeneralException(
            ApiErrors.SOMETHING_WENT_WRONG.value, status.HTTP_400_BAD_REQUEST
        )
