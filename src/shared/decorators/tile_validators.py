from functools import wraps

from src.exceptions import ApiErrors, GeneralException


def validate_tile_coordinates(func):
    """
    Validates the tile coordinates (z, x, y) passed to the function and raises an exception if they are invalid.
    """

    @wraps(func)
    async def wrapper(
        z: int,
        x: int,
        y: int,
        *args,
        **kwargs,
    ):
        MAX_ZOOM_LEVEL = 32

        # Each zoom level quadtree divides the tiles of the one before it, which creates a grid of 2**zoom X 2**zoom.
        # Ref: https://docs.mapbox.com/help/glossary/zoom-level/
        grid_size = 2**z

        if (
            z < 0
            or x < 0
            or y < 0
            or z >= MAX_ZOOM_LEVEL
            or x >= grid_size
            or y >= grid_size
        ):
            raise GeneralException(ApiErrors.INVALID_TILE_COORDINATES.value)

        return await func(z=z, x=x, y=y, *args, **kwargs)

    return wrapper
