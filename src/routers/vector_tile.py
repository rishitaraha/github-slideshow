from uuid import UUID

from botocore.exceptions import ClientError
from fastapi import Query, Request, Response, status

from ..db import PostgresManager
from ..exceptions import ApiErrors, GeneralException
from ..shared.aws import AwsManager, generate_tiles_s3_key, parse_s3_key
from ..shared.constants import TileFormat
from ..shared.decorators import validate_tile_coordinates


async def vector_tile_from_s3_view(
    z: int,
    x: int,
    y: int,
    key: str,
):
    bucket_name, tiles_dir_s3_key = parse_s3_key(key)
    tile_s3_key = generate_tiles_s3_key(tiles_dir_s3_key, z, x, y, TileFormat.PBF)

    try:
        tile = await AwsManager.get_file(bucket_name, tile_s3_key)

        return Response(
            tile,
            media_type="application/vnd.mapbox-vector-tile",
            headers={"Content-Encoding": "gzip"},
        )

    except ClientError:
        raise GeneralException(
            ApiErrors.TILE_NOT_FOUND.value, status.HTTP_404_NOT_FOUND
        )


async def vector_tile_from_db_view(
    z: int,
    x: int,
    y: int,
    layer_id: UUID,
):
    db_manager = PostgresManager()

    tile = await db_manager.generate_vector_tile(str(layer_id), z, x, y)

    if tile is None:
        raise GeneralException(
            ApiErrors.TILE_NOT_FOUND.value, status.HTTP_404_NOT_FOUND
        )

    return Response(
        tile,
        media_type="application/vnd.mapbox-vector-tile",
    )


@validate_tile_coordinates
async def vector_tile_view(
    request: Request,
    z: int,
    x: int,
    y: int,
    key: str = Query(None, description="S3 key of tiles folder"),
    layer_id: UUID = Query(None, description="Id of the layer"),
):
    if key:
        return await vector_tile_from_s3_view(z, x, y, key)
    elif layer_id:
        return await vector_tile_from_db_view(z, x, y, layer_id)
    else:
        raise GeneralException(ApiErrors.INVALID_PARAMETER.value)
