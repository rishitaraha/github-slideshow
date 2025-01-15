from botocore.exceptions import ClientError
from fastapi import Request, Response, status
from rasterio import RasterioIOError
from rio_tiler.errors import TileOutsideBounds
from rio_tiler.io import COGReader
from rio_tiler.profiles import img_profiles

from ..exceptions import ApiErrors, GeneralException
from ..shared import logger
from ..shared.aws import AwsManager, generate_tiles_s3_key, parse_s3_key
from ..shared.constants import TileFormat
from ..shared.decorators import validate_tile_coordinates


async def cog_tile_view(
    request: Request,
    z: int,
    x: int,
    y: int,
    key: str,
):
    cog_url = f"s3://{key}"

    try:
        with COGReader(
            str(cog_url),
        ) as cog:
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

    options = img_profiles.get("png", {})

    content = img.render(img_format="png", **options)

    return Response(content, media_type="image/png")


@validate_tile_coordinates
async def mbtiles_view(
    request: Request,
    z: int,
    x: int,
    y: int,
    key: str,
):
    bucket_name, tiles_dir_s3_key = parse_s3_key(key)
    tile_s3_key = generate_tiles_s3_key(tiles_dir_s3_key, z, x, y, TileFormat.PNG)
    try:
        tile = await AwsManager.get_file(bucket_name, tile_s3_key)
        return Response(tile, media_type="image/png")

    except ClientError:
        raise GeneralException(
            ApiErrors.TILE_NOT_FOUND.value, status.HTTP_404_NOT_FOUND
        )
