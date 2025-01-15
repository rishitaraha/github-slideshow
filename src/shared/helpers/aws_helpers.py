# Helper functions for interacting with AWS services.

import subprocess

from .. import logger


def parse_s3_uri(s3_uri: str) -> tuple[str, str]:
    """
    Parses an S3 URI into its bucket and key components.

    This function supports both URIs that start with "s3://" and those
    that are in the format "bucket_name/key" without the "s3://" prefix.

    Args:
        s3_uri: The S3 URI to be parsed.

    Returns:
        A tuple containing the bucket and key components of the S3 URI.

    Raises:
        ValueError: If the S3 URI is not in the correct format.
    """
    # Handle URIs with "s3://" prefix.
    if s3_uri.startswith("s3://"):
        s3_path = s3_uri[5:]
    else:
        s3_path = s3_uri

    # Split the path into bucket and key.
    s3_path_parts = s3_path.split("/", 1)

    # Ensure both bucket and key are present.
    if len(s3_path_parts) != 2 or not s3_path_parts[0] or not s3_path_parts[1]:
        raise ValueError(
            "Invalid S3 URI format. Expected 'bucket/key' or 's3://bucket/key'."
        )

    return s3_path_parts[0], s3_path_parts[1]


def upload_dir_to_s3(dir_path: str, s3_output_path: str) -> None:
    """
    Upload files from a local directory to an S3 bucket.

    Args:
        dir_path: The local directory path containing files to upload.
        s3_output_path: The S3 destination path where files will be uploaded.

    Returns:
        None

    Raises:
        Exception: If the AWS CLI command fails during the upload process.
    """
    logger.info(f"Uploading files from {dir_path} to {s3_output_path}")

    try:
        result = subprocess.run(
            ["aws", "s3", "cp", dir_path, s3_output_path, "--recursive"],
            check=True,
        )
        logger.info("Files uploaded to S3 successfully")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to upload files to S3: {s3_output_path}")
        logger.error(f"AWS CLI error: {e.stderr}")
        raise Exception(
            f"Failed to upload files to S3: {s3_output_path}. Error: {e.stderr}"
        )
