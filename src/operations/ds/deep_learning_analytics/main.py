import json
import os

from src.shared import logger
from src.shared.api_engine_manager.constants import Status
from src.shared.constants import EnvVariable
from src.shared.file_errors import FileError
from src.shared.helpers import (
    APIEngineURL,
    api_engine_url_generator,
    upload_smart_detect_shapefile,
    zip_shapefile_groups,
)
from src.shared.helpers.api_engine_helpers import update_status

from ..enums import DSDockerImage, FolderPaths
from ..helpers import (
    download_tif_and_get_epsg,
    handle_container_execution,
    prepare_shapefiles,
    run_docker_container,
    setup_docker_volumes_for_ds,
)
from .enums import DeepLearningAnalyticsOutputs, DeepLearningAnalyticsWorkflow
from .schemas import DeepLearningAnalyticsDockerPayload, DeepLearningAnalyticsPayload


def execute_deep_learning_analytics(payload: DeepLearningAnalyticsPayload):
    # TODO: Add proper handling for json payload.
    payload.outputs = json.loads(payload.outputs)
    smart_detect_update_status_url = api_engine_url_generator(
        APIEngineURL.SMART_DETECT_STATUS, {"smart_detect_id": payload.smart_detect_id}
    )
    try:
        """Main function to execute the deep learning analytics pipeline."""
        ORTHO_FILENAME = "ortho.tif"
        AOI_SHAPEFILE_NAME = "aoi.shp"
        ORTHO_PATH = os.path.join(FolderPaths.TEMP_DIR.value, ORTHO_FILENAME)
        AOI_SHAPEFILE_PATH = os.path.join(
            FolderPaths.TEMP_DIR.value, AOI_SHAPEFILE_NAME
        )

        # Step 1: Validate if requested outputs are supported.
        outputs = [output["type"] for output in payload.outputs]
        is_valid, invalid_items = DeepLearningAnalyticsOutputs.are_valid_members(
            outputs
        )

        # Step 2: Download orthomosaic and retrieve EPSG.
        ortho_epsg = download_tif_and_get_epsg(payload.input_ortho_s3_uri, ORTHO_PATH)

        # Step 3: Prepare shapefiles.
        prepare_shapefiles(payload.input_aoi_wkt, ortho_epsg, AOI_SHAPEFILE_PATH)

        # Step 4: Set up Docker volumes and payload.
        volumes = setup_docker_volumes_for_ds(
            FolderPaths.TEMP_DIR.value, FolderPaths.RESULTS_FOLDER.value
        )
        if payload.workflow == DeepLearningAnalyticsWorkflow.RURAL_FEATURE_DETECTION:
            image = DSDockerImage.RURAL_DETECTION.value
        elif payload.workflow == DeepLearningAnalyticsWorkflow.TREE_CANOPY_DETECTION:
            image = DSDockerImage.TREE_CANOPY_DETECTION.value

        docker_payload = DeepLearningAnalyticsDockerPayload(
            WORKFLOW=payload.workflow,
            INPUT_TIFF_PATH=os.path.join(
                FolderPaths.DOCKER_INPUTS_FOLDER.value, ORTHO_FILENAME
            ),
            INPUT_AOI_SHAPEFILE_PATH=os.path.join(
                FolderPaths.DOCKER_INPUTS_FOLDER.value, AOI_SHAPEFILE_NAME
            ),
            OUTPUT_FOLDER_PATH=FolderPaths.DOCKER_OUTPUTS_FOLDER.value,
        )

        # Step 5: Run Docker workflow.
        container = run_docker_container(image, docker_payload, volumes, gpu=True)

        # Step 6: Execute commands inside the container and handle cleanup.
        handle_container_execution(
            container, cleanup=(EnvVariable.ENVIRONMENT.value == "local")
        )

        if not is_valid:
            raise ValueError(
                f"Invalid outputs requested for Deep Learning Analytics: {invalid_items}"
            )

        # Step 7: Zip the results.
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
                logger.info("Failed to generate output for : {missing_file_group}")
                update_status(
                    Status.FAILED,
                    layer_file_status_url,
                    [FileError.FAILED_TO_GENERATE_OUTPUT.name],
                )

        logger.info("Pipeline executed successfully. Results are ready.")
    except Exception as e:
        logger.error(f"{payload.workflow} execution encountered an error: {e}")
        update_status(Status.FAILED, smart_detect_update_status_url)
        raise
