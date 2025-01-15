from typing import Tuple

from ..constants import TileFormat


def generate_tiles_s3_key(
    dir_s3_key: str, z: int, x: int, y: int, tile_format: TileFormat
) -> str:
    """
    Generates tile s3 key.
    """

    return f"{dir_s3_key}/{z}/{x}/{y}.{tile_format.value}"


def parse_s3_key(key: str) -> Tuple[str, str]:
    """
    Extracts bucket name and object key.
    """

    key_array = key.split("/")
    bucket_name = key_array[0]
    object_key = "/".join(key_array[1:])

    return bucket_name, object_key
