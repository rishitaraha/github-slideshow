from pathlib import Path

import boto3
import botocore

from .. import logger
from ..constants.env_variables import EnvVariable


class AwsManager:
    s3client = boto3.client("s3")
    default_bucket_name = EnvVariable.BUCKET_NAME.value

    @classmethod
    def download_file(cls, key: str, bucket: str = None, download_path: str = None):
        """
        Downloads a file from S3 to a local path.

        Args:
            key: The S3 key (path) to the file.
            bucket: The S3 bucket name. If not provided, the default bucket is used.
            download_path: The local path where the file should be saved. If not provided,
                           the file is saved to the default location based on the key.
        """
        bucket_name = bucket or cls.default_bucket_name

        # Use the provided download_path or fallback to the default path.
        filename = download_path

        # Creating directory if not exists.
        file_directory = filename.rsplit("/", 1)[0]
        Path(file_directory).mkdir(parents=True, exist_ok=True)

        try:
            logger.info("Downloading file: " + key)
            res = cls.s3client.download_file(bucket_name, key, filename)
            return res

        except botocore.exceptions.ClientError as error:
            logger.error("Download failed")
            raise Exception("File not found")

    @classmethod
    def upload_file(cls, file_path: str, key: str):
        return cls.s3client.upload_file(
            file_path,
            cls.default_bucket_name,
            key,
        )
