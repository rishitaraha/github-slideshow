from ..shared.api_engine_manager import ClampToTerrainStatus, api_engine


def update_clamp_to_terrain_status(url: str, status: ClampToTerrainStatus):
    """
    Update the status of the Clamp to Terrain process in an external API.

    Args:
        url: The URL for the update request.
        status: The status to be updated.

    Returns:
        None

    Raises:
        None
    """
    return api_engine.patch(
        url,
        data={"status": status.value},
    )
