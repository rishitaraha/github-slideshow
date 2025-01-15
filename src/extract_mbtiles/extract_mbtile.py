import json
import os
import tempfile

from ..shared import logger
from ..shared.api_engine_manager.constants import Status
from ..shared.helpers import (
    parse_s3_uri,
    update_properties,
    update_status,
    upload_dir_to_s3,
)
from ..shared.resources.aws_manager import AwsManager
from .helpers import extract_mbtiles
from .schema import ExtractMbtilesPayload


def extract_mbtile(data: ExtractMbtilesPayload):

    # Create a temporary directory for processing.
    with tempfile.TemporaryDirectory() as temp_dir:

        # Variables
        resource_file_local = os.path.join(temp_dir, "input.mbtiles")
        output_files_path = os.path.join(temp_dir, "output_dir")

        # Parsing the S3 URI into s3_input_key and s3_bucket_name.
        s3_input_bucket_name, s3_input_key = parse_s3_uri(data.input_s3_uri)
        s3_output_path = f"s3://{data.output_s3_uri}"

        # Update status to processing.
        update_status(Status.PROCESSING, data.update_status_url)

        logger.info("Starting MBTiles extraction process...")

        # Download mbtiles file to temp directory.
        try:
            logger.info(f"Attempting to download mbtiles file from: {s3_input_key}")
            AwsManager.download_file(
                s3_input_key, s3_input_bucket_name, resource_file_local
            )
            if not os.path.exists(resource_file_local):
                raise Exception(
                    f"Failed to download MBTiles file to {resource_file_local}"
                )

        except Exception as e:
            update_status(Status.FAILED, data.update_status_url)
            logger.exception(f"Failed to download file from S3: {e}")
            return

        # Extract mbtiles
        try:
            extract_mbtiles(resource_file_local, output_files_path)

            if not os.path.isdir(output_files_path) or not os.listdir(
                output_files_path
            ):
                raise Exception(
                    "Mbtiles extraction failed: Output directory is missing or empty"
                )

            logger.info(f"Files in output directory: {os.listdir(output_files_path)}")

        except Exception as e:
            update_status(Status.FAILED, data.update_status_url)
            logger.exception(f"Mbtiles extraction failed: {e}")
            return

        # Upload extracted files to S3.
        try:
            upload_dir_to_s3(output_files_path, s3_output_path)
            logger.info("MBTiles files uploaded to S3 successfully.")

        except Exception as e:
            update_status(Status.FAILED, data.update_status_url)
            logger.exception(f"Failed to upload files to S3: {e}")
            return

        # Load metadata.json file and update properties.
        metadata_file_path = os.path.join(output_files_path, "metadata.json")
        if not os.path.exists(metadata_file_path):
            update_status(Status.FAILED, data.update_status_url)
            logger.error(f"metadata.json not found at {metadata_file_path}")
            return

        try:
            with open(metadata_file_path, "r") as f:
                metadata = json.load(f)
                updated_properties = {
                    "bounds": (
                        metadata.get("bounds", "").split(",")
                        if metadata.get("bounds")
                        else None
                    ),
                    "minzoom": metadata.get("minzoom"),
                    "maxzoom": metadata.get("maxzoom"),
                }
                update_properties(updated_properties, data.update_properties_url)
                update_status(Status.DONE, data.update_status_url)
                logger.info("MBTiles extraction and processing completed successfully.")

        except (FileNotFoundError, json.JSONDecodeError) as e:
            update_status(Status.FAILED, data.update_status_url)
            logger.error(f"Error reading metadata.json file: {e}")
            return
