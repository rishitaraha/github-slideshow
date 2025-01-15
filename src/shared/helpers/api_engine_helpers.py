# Helper functions for interacting with the API engine.

from typing import Dict, List

from src.shared.api_engine_manager import (
    APIEngineURL,
    Status,
    VectorFileFormat,
    api_engine,
    api_engine_url_generator,
)

from .. import logger


def update_status(status: Status, url: str, errors: List[str] = None) -> None:
    """
    Update the status of a process in an external API.

    Args:
        status: The new status to be set, represented by an instance of FileStatus.
        url: The URL for the status update request.

    Returns:
        None

    Raises:
        Exception: If the API request fails or if an error occurs during the status update.
    """
    data = {"status": status.value}

    if errors:
        data["errors"] = errors

    response = api_engine.patch(
        url,
        data=data,
    )

    if response.status_code != 200:
        logger.error("Failed to update status for value:" + status.value)
    else:
        logger.info(response.text)
        logger.info("Status updated to " + status.value)


def update_properties(properties: dict, url: str) -> None:
    """
    Update properties in an external API.

    Args:
        properties: A dictionary containing properties to be updated.
        url: The URL for the update request.

    Returns:
        None

    Raises:
        Exception: If the API request fails or if an error occurs during property update.
    """
    try:
        response = api_engine.patch(
            url,
            headers={"Content-Type": "application/json"},
            data={"properties": properties},
        )
        logger.info(response.text)
        logger.info("Properties added/updated with " + str(properties))
    except Exception as e:
        logger.error(f"Failed to update properties: {e}")


def download_layer(
    layer_id: Dict,
    response_format: VectorFileFormat,
    file_path: str,
) -> bool:
    """
    Downloads a vector file from API Engine and saves it to the specified file path.

    Args:
        url : str
            The URL to download the file from.
        response_format : VectorFileFormat
            The format of the vector file (e.g., GeoJSON, Shapefile).
        file_path : str
            The local path to save the downloaded file.

    Returns:
        bool

    Example:
        >>> download_layer("https://example.com/api", VectorFileFormat.GEOJSON, "file.geojson")
    """
    try:
        url = api_engine_url_generator(
            APIEngineURL.LAYERS_DOWNLOAD, {"layer_id": layer_id}
        )
        response = api_engine.request(
            "GET",
            url,
            params={"response_format": response_format.value},
        )

        if response.status_code == 200:
            with open(file_path, "wb") as file:
                file.write(response.content)
            logger.info(f"File downloaded successfully to {file_path}")
            return True
        else:
            logger.error(
                f"Failed to download file. HTTP Status Code: {response.status_code}"
            )
            return False
    except Exception as e:
        logger.error(f"An error occurred: {e}")


def upload_haul_road_layer_shapefile(
    haul_road_id: str,
    haul_road_type: str,
    shapefile_zip_path: str,
):
    try:
        url = api_engine_url_generator(
            APIEngineURL.HAUL_ROADS_LAYER, {"haul_road_id": haul_road_id}
        )

        with open(shapefile_zip_path, "rb") as file:
            files = [
                (
                    "shape_file",
                    (
                        shapefile_zip_path.split("/")[-1],
                        file,
                        "application/zip",
                    ),
                )
            ]

            response = api_engine.request(
                "POST",
                url,
                files=files,
                data={"type": haul_road_type},
            )

            if response.status_code == 202:
                logger.info(
                    f"Shapefile upload request successfully accepted for Haul Road Type: {haul_road_type},\nResponse: {response.text}"
                )
            else:
                logger.error(response.text)
                logger.error("Failed to upload shapefile zip")

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        raise


def upload_smart_detect_shapefile(
    smart_detect_id: str, layer_id: str, output_type: str, shapefile_zip_path: str
):
    try:
        url = api_engine_url_generator(
            APIEngineURL.SMART_DETECT_UPLOAD, {"smart_detect_id": smart_detect_id}
        )

        with open(shapefile_zip_path, "rb") as file:
            files = [
                (
                    "shape_file",
                    (
                        shapefile_zip_path.split("/")[-1],
                        file,
                        "application/zip",
                    ),
                )
            ]

            response = api_engine.request(
                "POST",
                url,
                files=files,
                data={"type": output_type, "layer_id": layer_id},
            )

            if response.status_code == 202:
                logger.info(
                    f"Shapefile upload request successfully accepted for the Smart Detect Output: {output_type},\nResponse: {response.text}"
                )
            else:
                logger.error(response.text)
                logger.error("Failed to upload shapefile zip")

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        raise


def update_haul_road_output_status(
    haul_road_id: str, haul_road_type: str, status: Status, errors: List[str]
) -> bool:
    try:
        url = api_engine_url_generator(
            APIEngineURL.HAUL_ROADS_LAYER_STATUS, {"haul_road_id": haul_road_id}
        )

        response = api_engine.request(
            "PATCH",
            url,
            data={"type": haul_road_type, "status": status.value, "errors": errors},
        )

        if response.status_code == 200:
            logger.info(
                f" Successfully updated Haul road layer status to {status.value} for layer type: {haul_road_type}"
            )
        else:
            logger.error(f"Haul road layer status update failed: {response.text}")
    except Exception as e:
        logger.error(f"An error occurred: {e}")
