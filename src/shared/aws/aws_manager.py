import asyncio

import aioboto3
from botocore.config import Config
from botocore.exceptions import ClientError
from fastapi import status

from ...exceptions import ApiErrors, GeneralException
from .. import logger


class AwsManager:
    session = aioboto3.Session()

    _s3_client_config = Config(retries=dict(max_attempts=1))
    _s3_client = None

    # https://docs.python.org/3/library/asyncio-sync.html#asyncio.Lock
    _lock = asyncio.Lock()

    @classmethod
    async def _get_s3_client(cls):
        """
        Retrieve or create an S3 client instance.

        This method checks if an S3 client already exists. If the client is
        present, it returns it immediately without acquiring a lock, avoiding
        unnecessary blocking. If the client is not initialized, it acquires a lock
        to ensure thread-safe initialization of the S3 client in an asynchronous
        environment.

        The double-check mechanism ensures that only one instance of the S3 client
        is created even when multiple coroutines call this method concurrently.

        Returns:
            The S3 client instance.
        """

        # Check if client is already created before acquiring the lock.
        if cls._s3_client is not None:
            return cls._s3_client

        # Acquire lock, to avoid race condition for the creation of the client.
        async with cls._lock:
            # Double-check inside the lock to ensure client wasn't created by another coroutine.
            if cls._s3_client is None:
                logger.info("Creating S3 client")

                # Using __aenter__() to properly initialize the asynchronous S3 client within a context manager. boto3's async session client needs to be used within an async context and thus requires entering it explicitly.
                # Ref: https://aioboto3.readthedocs.io/en/latest/usage.html#streaming-download
                cls._s3_client = await cls.session.client(
                    "s3", config=cls._s3_client_config
                ).__aenter__()

        return cls._s3_client

    @classmethod
    async def get_file(cls, bucket_name: str, key: str) -> bytes:
        """
        Retrieve a file from the specified S3 bucket.

        Args:
            bucket_name (str): The name of the S3 bucket.
            key (str): The key of the file in the S3 bucket.

        Returns:
            bytes: The file content.
        """

        s3_client = await cls._get_s3_client()
        try:
            response = await s3_client.get_object(Bucket=bucket_name, Key=key)

            async with response["Body"] as stream:
                file_content = await stream.read()

            return file_content

        except ClientError as client_exception:
            logger.debug(f"Bucket: {bucket_name}")
            logger.debug(f"File Key: {key}")

            if client_exception.response["Error"]["Code"] == "404":
                logger.warning("The object does not exist in s3.")
            else:
                logger.warning(client_exception)

            raise client_exception

        except Exception as e:
            logger.exception(f"Unexpected boto3 exception: {e}")

            raise GeneralException(
                ApiErrors.SOMETHING_WENT_WRONG.value,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

    @classmethod
    async def destroy(cls):
        if cls._s3_client:
            # Properly close the S3 client using __aexit__() to ensure resources are released.
            await cls._s3_client.__aexit__(None, None, None)
            cls._s3_client = None
