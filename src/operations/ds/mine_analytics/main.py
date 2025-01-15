import json
import os

from osgeo import gdal

from src.core import DockerManager
from src.shared import logger
from src.shared.api_engine_manager import (
    APIEngineURL,
    Status,
    VectorFileFormat,
    api_engine_url_generator,
)
from src.shared.constants import EnvVariable
from src.shared.file_errors import FileError
from src.shared.helpers import (
    create_geometries_from_wkts,
    create_shapefile_from_geometries,
    download_layer,
    extract_zip_file,
    parse_s3_uri,
    update_haul_road_output_status,
    update_status,
    upload_haul_road_layer_shapefile,
    upload_smart_detect_shapefile,
    zip_shapefile_groups,
)
from src.shared.resources import AwsManager

from ..enums import DSDockerImage, FolderPaths
from ..helpers import (
    download_tif_and_get_epsg,
    extract_linestrings_from_wkt,
    handle_container_execution,
    prepare_shapefiles,
    run_docker_container,
    setup_docker_volumes_for_ds,
)
from .enums import (
    HRAOutputs,
    HRAWorkflow,
    MineAnalyticsOutputs,
    MineAnalyticsWorkflow,
    hra_output_to_layer_type_mapping,
)
from .schemas import (
    HRADockerPayload,
    HRAPayload,
    MineAnalyticsDockerPayload,
    MineAnalyticsPayload,
)


# TODO: Refactor to reuse most of the code.
def execute_hra(payload: HRAPayload):
    """
    Execute the HRA workflow inside a Docker container.

    Args:
        payload (HRAPayload): Input payload with configuration and data paths.
    """
    # Path Variables.
    DEM_FILENAME = "hra_dem.tif"
    SHAPEFILE_NAME = "edges.shp"
    MEDIANS_SHAPEFILE_NAME = "medians.shp"
    MEDIANS_SHAPEFILE_ZIP = "medians_shp.zip"
    DEM_PATH = os.path.join(FolderPaths.TEMP_DIR.value, DEM_FILENAME)
    SHAPEFILE_PATH = os.path.join(FolderPaths.TEMP_DIR.value, SHAPEFILE_NAME)
    MEDIANS_ZIP_PATH = os.path.join(FolderPaths.TEMP_DIR.value, MEDIANS_SHAPEFILE_ZIP)

    # Variables.
    is_medians_input_enabled = (
        True
        if payload.input_medians_layer_id
        and payload.workflow == HRAWorkflow.HRA_FROM_INPUT_EDGES
        else False
    )
    haul_road_status_url = api_engine_url_generator(
        APIEngineURL.HAUL_ROADS_STATUS, {"haul_road_id": payload.haul_road_id}
    )

    # Download DEM if not already available.
    bucket, key = parse_s3_uri(payload.input_dtm_path)
    if not os.path.exists(DEM_PATH):
        AwsManager.download_file(key=key, bucket=bucket, download_path=DEM_PATH)
    else:
        logger.info("DEM file already exists.")

    dem_dataset = gdal.Open(DEM_PATH)
    if dem_dataset is None:
        update_status(Status.FAILED, haul_road_status_url)
        raise FileNotFoundError(f"DEM file not found: {DEM_PATH}")
    int(dem_dataset.GetSpatialRef().GetAttrValue("AUTHORITY", 1))
    del dem_dataset

    # Parse WKT geometries based on workflow.
    if (
        payload.workflow == HRAWorkflow.HRD_FROM_SMART_LINE
        or payload.workflow == HRAWorkflow.HRD_FROM_CENTER_LINE
    ):
        wkt_geometries = [payload.input_linestring_wkt]
        if len(wkt_geometries) != 1:
            raise Exception(
                "For {payload.workflow} workflow the input string must have exactly 1 linestring."
            )

    elif payload.workflow == HRAWorkflow.HRA_FROM_INPUT_EDGES:
        wkt_geometries = extract_linestrings_from_wkt(payload.input_linestring_wkt)
        if len(wkt_geometries) != 2:
            raise Exception(
                f"For {payload.workflow} workflow the input string must have exactly 2 linestrings."
            )
        if payload.input_medians_layer_id:
            # Download and extract medians shapefile.
            download_layer(
                payload.input_medians_layer_id,
                VectorFileFormat.SHAPEFILE,
                MEDIANS_ZIP_PATH,
            )
            extract_zip_file(MEDIANS_ZIP_PATH, FolderPaths.TEMP_DIR.value, "medians")

    geometries = create_geometries_from_wkts([wkt for wkt in wkt_geometries], 4326)

    # Create shapefile from geometries.
    create_shapefile_from_geometries(geometries, SHAPEFILE_PATH)

    # Prepare Docker payload.
    docker_payload = HRADockerPayload(
        WORKFLOW=payload.workflow,
        INPUT_LINESTRING_SHAPEFILE_PATH=os.path.join(
            FolderPaths.DOCKER_INPUTS_FOLDER.value, SHAPEFILE_NAME
        ),
        INPUT_DTM_PATH=os.path.join(
            FolderPaths.DOCKER_INPUTS_FOLDER.value, DEM_FILENAME
        ),
        INPUT_MEDIAN_FILE_PATH=(
            os.path.join(FolderPaths.DOCKER_INPUTS_FOLDER.value, MEDIANS_SHAPEFILE_NAME)
            if is_medians_input_enabled
            else None
        ),
        CHAINAGE_DISTANCE=payload.chainage_distance,
        VEHICLE_WIDTH=payload.vehicle_width,
    )

    # Setup Docker volumes and authenticate.
    volumes = setup_docker_volumes_for_ds(
        FolderPaths.TEMP_DIR.value,
        FolderPaths.RESULTS_FOLDER.value,
    )

    hra_image = DSDockerImage.HRA.value
    DockerManager.authenticate_to_ecr(
        region=hra_image.region, repository_uri=hra_image.repository_uri
    )
    DockerManager.pull_image(hra_image.uri_without_tag, hra_image.tag)

    container = DockerManager.run_container(
        image=hra_image.full_uri,
        environment=docker_payload.model_dump(),
        volumes=volumes,
        detach=True,
        tty=True,
        stdin_open=True,
    )
    logger.info("HRA Docker container started.")

    try:
        logger.info("Executing HRA...")
        exit_code, output = container.exec_run(
            cmd=["python3", "-m", "src.main"], demux=True
        )
        output = output[1].decode("utf-8") if output else "No output"

        if exit_code != 0:
            raise RuntimeError(
                f"HRA execution failed with exit_code:{exit_code}, output: {output}"
            )
        else:
            logger.info(output)

        output_folder = os.path.join(FolderPaths.RESULTS_FOLDER.value, "results")

        result = zip_shapefile_groups(output_folder, output_folder, HRAOutputs.values())

        zip_paths = result["zipped_files"]
        missing_files = result["missing_files"]

        for output, path in zip_paths.items():
            type = hra_output_to_layer_type_mapping[output]
            upload_haul_road_layer_shapefile(
                payload.haul_road_id,
                type,
                path,
            )

        if missing_files is not None:
            for missing_file_group in missing_files.keys():
                type = hra_output_to_layer_type_mapping[missing_file_group]

            update_haul_road_output_status(
                payload.haul_road_id,
                type,
                Status.FAILED,
                [FileError.FAILED_TO_GENERATE_OUTPUT.name],
            )

        logger.info("HRA Executed successfully!")

    except Exception as e:
        logger.error(f"HRA execution encountered an error: {e}")
        update_status(Status.FAILED, haul_road_status_url)
        raise


def execute_mine_analytics(payload: MineAnalyticsPayload):
    # TODO: Add proper handling for json payload.
    payload.outputs = json.loads(payload.outputs)
    smart_detect_update_status_url = api_engine_url_generator(
        APIEngineURL.SMART_DETECT_STATUS, {"smart_detect_id": payload.smart_detect_id}
    )

    try:
        """Main function to execute the mine analytics pipeline."""
        DEM_NAME = "bctd_dem.tif"
        AOI_SHAPEFILE_NAME = "aoi.shp"
        DEM_PATH = os.path.join(FolderPaths.TEMP_DIR.value, DEM_NAME)
        AOI_SHAPEFILE_PATH = os.path.join(
            FolderPaths.TEMP_DIR.value, AOI_SHAPEFILE_NAME
        )

        # Step 1: Validate if requested outputs are supported.
        outputs = [output["type"] for output in payload.outputs]
        is_valid, invalid_items = MineAnalyticsOutputs.are_valid_members(outputs)

        if not is_valid:
            raise ValueError(
                f"Invalid outputs requested for Deep Learning Analytics: {invalid_items}"
            )

        # Step 2: Download orthomosaic and retrieve EPSG.
        dem_epsg = download_tif_and_get_epsg(payload.input_dem_s3_uri, DEM_PATH)

        # Step 3: Prepare shapefiles.
        if payload.input_aoi_wkt is not None:
            prepare_shapefiles(payload.input_aoi_wkt, dem_epsg, AOI_SHAPEFILE_PATH)

        # Step 4: Set up Docker volumes and payload.
        volumes = setup_docker_volumes_for_ds(
            FolderPaths.TEMP_DIR.value, FolderPaths.RESULTS_FOLDER.value
        )

        if payload.workflow == MineAnalyticsWorkflow.DRAINAGE_ANALYSIS:
            image = DSDockerImage.DRAINAGE_ANALYSIS.value
        elif payload.workflow == MineAnalyticsWorkflow.HEAP_BOUNDARY_DETECTION:
            image = DSDockerImage.HEAP_BOUNDARY_DETECTION.value
        elif payload.workflow == MineAnalyticsWorkflow.BENCH_CREST_TOE_DETECTION:
            image = DSDockerImage.BENCH_CREST_TOE_DETECTION.value

        docker_payload = MineAnalyticsDockerPayload(
            WORKFLOW=payload.workflow,
            INPUT_DTM_PATH=os.path.join(
                FolderPaths.DOCKER_INPUTS_FOLDER.value, DEM_NAME
            ),
            INPUT_AOI_SHAPEFILE_PATH=(
                None
                if payload.input_aoi_wkt is None
                else os.path.join(
                    FolderPaths.DOCKER_INPUTS_FOLDER.value, AOI_SHAPEFILE_NAME
                )
            ),
            OUTPUT_FOLDER_PATH=FolderPaths.DOCKER_OUTPUTS_FOLDER.value,
        )

        # Step 5: Run Docker workflow.
        container = run_docker_container(image, docker_payload, volumes)

        # Step 6: Execute commands inside the container and handle cleanup.
        handle_container_execution(
            container,
            cleanup=(EnvVariable.ENVIRONMENT.value == "local"),
            workflow=payload.workflow.value,
        )

        # Step 7: Zip results
        results = zip_shapefile_groups(
            FolderPaths.RESULTS_FOLDER.value,
            FolderPaths.RESULTS_FOLDER.value,
            outputs,
        )

        zip_paths = results["zipped_files"]
        missing_files = results["missing_files"]

        logger.debug(f"zip_paths: {zip_paths}")
        logger.debug(f"missing_files: {missing_files}")

        output_layer_id_mapping = {
            output["type"]: output["layer_id"] for output in payload.outputs
        }

        for output, path in zip_paths.items():
            layer_id = output_layer_id_mapping.get(output)
            upload_smart_detect_shapefile(
                payload.smart_detect_id,
                layer_id=layer_id,
                output_type=output,
                shapefile_zip_path=path,
            )

        if missing_files is not None:
            for missing_file_group in missing_files.keys():
                layer_id = output_layer_id_mapping.get(missing_file_group)
                layer_file_status_url = api_engine_url_generator(
                    APIEngineURL.LAYERS_FILE_STATUS,
                    {"layer_id": layer_id},
                )

                update_status(
                    Status.FAILED,
                    layer_file_status_url,
                    [FileError.FAILED_TO_GENERATE_OUTPUT.name],
                )

        logger.info("Pipeline executed successfully. Results are ready.")
    except Exception as e:
        logger.error(f"HRA execution encountered an error: {e}")
        update_status(Status.FAILED, smart_detect_update_status_url)
        raise
