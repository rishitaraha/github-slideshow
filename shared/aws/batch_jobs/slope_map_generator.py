from rainbow.env_variables import EnvVariable

from ...models import BatchJob
from ..aws_manager import AwsManager
from .schemas import SlopeMapGeneratorPayloadSchema


def submit_slope_map_generator_job(
    job_name: str, payload: SlopeMapGeneratorPayloadSchema
) -> BatchJob:
    # Remove preceeding slash from update status url so that it is queryable in event bridge.
    update_status_url = (
        payload["update_status_url"][1:]
        if payload["update_status_url"][0] == "/"
        else payload["update_status_url"]
    )

    batch_job_env_variables = [
        {
            "name": "INPUT_S3_KEY",
            "value": payload["input_s3_uri"],
        },
        {
            "name": "OUTPUT_S3_KEY",
            "value": payload["output_s3_uri"],
        },
        {
            "name": "RESOURCE_ID",
            "value": payload["resource_id"],
        },
        {
            "name": "UPDATE_STATUS_URL",
            "value": update_status_url,
        },
        {
            "name": "ORG_NAME",
            "value": payload["org_name"],
        },
        {
            "name": "PROJECT_NAME",
            "value": payload["project_name"],
        },
        {
            "name": "SITE_NAME",
            "value": payload["site_name"],
        },
        {
            "name": "ITERATION_NAME",
            "value": payload["iteration_name"],
        },
        {
            "name": "LAYER_NAME",
            "value": payload["layer_name"],
        },
    ]

    job_output = AwsManager.submit_batch_job(
        EnvVariable.AWS_BATCH_SLOPE_MAP_JOB_DEFINITION.value,
        EnvVariable.AWS_BATCH_SLOPE_MAP_JOB_QUEUE.value,
        job_name,
        batch_job_env_variables,
    )

    return BatchJob.objects.create(
        job_id=job_output["jobId"],
        env_variables=batch_job_env_variables,
    )
