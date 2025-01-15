import os
import re
from typing import Dict, List

import docker
from osgeo import gdal

from src.core import DockerImage, DockerManager
from src.shared import logger
from src.shared.helpers import parse_s3_uri
from src.shared.helpers.gdal_helpers.vector_helpers import (
    create_geometries_from_wkts,
    create_shapefile_from_geometries,
)
from src.shared.helpers.shapely_helpers import transform_geometries
from src.shared.resources.aws_manager import AwsManager

from .enums import FolderPaths


def setup_docker_volumes_for_ds(
    inputs_path: str, results_path: str
) -> Dict[str, Dict[str, str]]:
    """
    Configure volume bindings for a Docker container.

    Args:
        inputs_path (str): Path to the inputs folder.
        results_path (str): Path to the results folder.

    Returns:
        Dict[str, Dict[str, str]]: Volume bindings.

    Raises:
        ValueError: If host paths cannot be determined.
    """

    container_id = DockerManager.get_current_container_id()
    host_paths = DockerManager.get_host_paths(container_id, [inputs_path, results_path])
    host_inputs = host_paths[inputs_path]
    host_results = host_paths[results_path]

    if not host_inputs or not host_results:
        raise ValueError("Host paths for inputs or results could not be determined.")

    return {
        host_results: {"bind": FolderPaths.DOCKER_OUTPUTS_FOLDER.value, "mode": "rw"},
        host_inputs: {"bind": FolderPaths.DOCKER_INPUTS_FOLDER.value, "mode": "rw"},
    }


def extract_linestrings_from_wkt(input_wkt: str) -> List[str]:
    """
    Extract LINESTRING patterns from a WKT string.

    Args:
        input_wkt (str): Input WKT string.

    Returns:
        List[str]: List of LINESTRING WKT strings.
    """
    linestring_pattern = r"LINESTRING \([^)]+\)"
    return re.findall(linestring_pattern, input_wkt)


# TODO: Put in utils.
def snake_to_title_case(snake_str: str):
    """
    Convert a snake_case string to Title Case.

    Args:
        snake_str (str): The snake_case string to convert.

    Returns:
        str: The converted Title Case string.
    """
    # Split the string on underscores, capitalize each part, and join with spaces
    return " ".join(word.capitalize() for word in snake_str.split("_"))


def download_tif_and_get_epsg(input_s3_uri: str, path: str) -> int:
    """Download TIF file if not available and retrieve its EPSG code."""
    bucket, key = parse_s3_uri(input_s3_uri)

    if not os.path.exists(path):
        AwsManager.download_file(key=key, bucket=bucket, download_path=path)
        logger.info("TIF file downloaded successfully.")
    else:
        logger.info("TIF file already exists at the specified path.")

    dataset = gdal.Open(path)
    if dataset is None:
        raise FileNotFoundError(f"TIF file not found: {path}")

    epsg_code = int(dataset.GetSpatialRef().GetAttrValue("AUTHORITY", 1))
    del dataset
    return epsg_code


def prepare_shapefiles(wkt: str, epsg: int, output_path: str):
    """Transform and reproject geometries, then create shapefile."""
    reprojected_geometries = transform_geometries([wkt], epsg, 4326)
    geometries = create_geometries_from_wkts(
        [geom.wkt for geom in reprojected_geometries], epsg
    )
    create_shapefile_from_geometries(geometries, output_path)


def run_docker_container(image: DockerImage, docker_payload, volumes, gpu=False):
    """Pull Docker image and execute the container."""
    DockerManager.authenticate_to_ecr(
        region=image.region, repository_uri=image.repository_uri
    )

    logger.info("Pulling Docker image...")
    DockerManager.pull_image(image.uri_without_tag, image.tag)

    container = DockerManager.run_container(
        image=image.full_uri,
        environment=docker_payload.model_dump(),
        volumes=volumes,
        detach=True,
        tty=True,
        stdin_open=True,
        device_requests=(
            [docker.types.DeviceRequest(count=-1, capabilities=[["gpu"]])]
            if gpu
            else None
        ),
    )

    logger.info("Docker container started successfully.")
    return container


def handle_container_execution(container, cleanup=False, workflow="workflow"):
    """Execute commands inside the Docker container and handle cleanup."""
    workflow = snake_to_title_case(workflow)
    try:
        logger.info(f"Executing {workflow} inside the container...")
        exit_code, output = container.exec_run(
            cmd=["python3", "-m", "src.main"], demux=True
        )
        output = output[1].decode("utf-8")

        if exit_code != 0:
            raise RuntimeError(
                f"{workflow} execution failed with exit_code:{exit_code}, output: {output}"
            )
        else:
            logger.info(output)
            logger.info(f"{workflow} executed successfully.")
    finally:
        if cleanup:
            DockerManager.container_cleanup(container)

    return exit_code
