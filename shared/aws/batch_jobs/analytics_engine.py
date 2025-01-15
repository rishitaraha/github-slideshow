from rainbow import logger
from rainbow.env_variables import EnvVariable

from ...models import BatchJob
from ..aws_manager import AwsManager


def submit_analytics_job(
    job_name: str, payload: dict, with_gpu: bool = False
) -> BatchJob:
    batch_job_env_variables = [
        {"name": key, "value": str(value)} for key, value in payload.items()
    ]

    job_definition = EnvVariable.AWS_BATCH_ANALYTICS_ENGINE_JOB_DEFINITION.value
    job_queue = EnvVariable.AWS_BATCH_ANALYTICS_ENGINE_JOB_QUEUE.value
    if with_gpu:
        job_definition = (
            EnvVariable.AWS_BATCH_ANALYTICS_ENGINE_WITH_GPU_JOB_DEFINITION.value
        )
        job_queue = EnvVariable.AWS_BATCH_ANALYTICS_ENGINE_WITH_GPU_JOB_QUEUE.value

    job_output = AwsManager.submit_batch_job(
        job_definition,
        job_queue,
        job_name,
        batch_job_env_variables,
    )

    logger.info(f"Submitted analytics job: {job_name} with data: {payload}")

    return BatchJob.objects.create(
        job_id=job_output["jobId"],
        env_variables=batch_job_env_variables,
    )
