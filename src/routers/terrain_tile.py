import json
from uuid import UUID

from botocore.exceptions import ClientError
from fastapi import Request, Response, status

from ..assets import AssetPath
from ..exceptions import ApiErrors, GeneralException
from ..shared.aws import AwsManager, generate_tiles_s3_key, parse_s3_key
from ..shared.constants import TileFormat
from ..shared.validators import validate_data_access_permission

# Open the file once and read it into memory. Since the file is very small, we can keep it in memory and use it multiple times without reopen the file.
with open(AssetPath.EMPTY_CESIUM_TERRAIN.value, "rb") as file:
    EMPTY_TILE = file.read()  # Size: 7728 Bytes


# TODO: This is a hacky solution. Remove this after CTOD.
def update_available_tile_array(metadata: bytes) -> str:
    metadata_dict = json.loads(metadata.decode())

    # Update the 'available' array from zoom 6 to 14.
    for index in range(6, 15):
        for entry in metadata_dict["available"][index]:
            entry["startX"] -= 1
            entry["startY"] -= 1
            entry["endX"] += 1
            entry["endY"] += 1

    return json.dumps(metadata_dict)


async def terrain_metadata_view(
    request: Request,
    key: str,
    iteration_id: UUID,
):
    bucket_name, tiles_dir_s3_key = parse_s3_key(key)

    # Check if user has permission to view the data.
    await validate_data_access_permission(request, key, iteration_id)

    try:
        metadata = await AwsManager.get_file(
            bucket_name, f"{tiles_dir_s3_key}/layer.json"
        )

        updated_metadata = update_available_tile_array(metadata)

        return Response(updated_metadata, media_type="application/json")

    except ClientError:
        raise GeneralException(
            ApiErrors.METADATA_NOT_FOUND.value, status.HTTP_404_NOT_FOUND
        )


async def terrain_tile_view(
    request: Request,
    z: int,
    x: int,
    y: int,
    key: str,
):
    bucket_name, tiles_dir_s3_key = parse_s3_key(key)
    tile_s3_key = generate_tiles_s3_key(tiles_dir_s3_key, z, x, y, TileFormat.TERRAIN)

    try:
        tile = await AwsManager.get_file(bucket_name, tile_s3_key)

        headers = {
            "Content-Encoding": "gzip",
            "Content-Disposition": "attachment;filename=" + f"{y}.terrain",
        }

        return Response(
            tile,
            media_type="application/octet-stream",
            headers=headers,
        )

    except ClientError:
        return Response(EMPTY_TILE, media_type="application/octet-stream")
