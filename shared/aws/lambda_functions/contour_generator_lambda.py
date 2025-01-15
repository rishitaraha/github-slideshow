from rest_framework import status

from rainbow.env_variables import EnvVariable

from ..aws_manager import AwsManager
from .schemas import ContourGeneratorPayloadSchema


def invoke_generate_contour(payload: ContourGeneratorPayloadSchema) -> status:
    return AwsManager.invoke_lambda_function(
        EnvVariable.AWS_LAMBDA_CONTOUR_GENERATOR_FUNCTION.value, payload=payload
    )
