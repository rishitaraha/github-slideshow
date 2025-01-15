from rainbow.env_variables import EnvVariable

from ..aws_manager import AwsManager
from .schemas import ExportS3PayloadSchema


def invoke_export_s3_to_s3(payload: ExportS3PayloadSchema) -> int:
    """
    The function `invoke_export_s3_to_s3` takes a payload containing source and destination S3 URIs,
    parses them, and invokes an AWS Lambda function with the necessary information.

    Args:
        payload: The `invoke_export_s3_to_s3` function takes in a payload of type `ExportS3PayloadSchema`

    Returns:
        The function `invoke_export_s3_to_s3` is returning an integer value. The integer value is
    the result of invoking a Lambda function using the `AwsManager.invoke_lambda_function` method with
    the provided payload.
    """
    return AwsManager.invoke_lambda_function(
        EnvVariable.AWS_EXPORT_FUNCTION.value, payload=payload
    )
