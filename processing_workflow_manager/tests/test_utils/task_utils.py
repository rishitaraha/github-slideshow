from processing_workflow_manager.constants.processing_constants import (
    JobType,
    ProcessingBatchJobEnvironmentVariable,
)
from rainbow.env_variables import EnvVariable


def get_task_batch_job_env_variables(task_id):
    return {
        "environment": [
            {
                "name": ProcessingBatchJobEnvironmentVariable.BucketName.value,
                "value": EnvVariable.OUTPUT_BUCKET_NAME.value,
            },
            {
                "name": ProcessingBatchJobEnvironmentVariable.LicenseBucketName.value,
                "value": EnvVariable.LICENSE_BUCKET_NAME.value,
            },
            {
                "name": ProcessingBatchJobEnvironmentVariable.MasterServerHost.value,
                "value": EnvVariable.MASTER_SERVER_HOST.value,
            },
            {
                "name": ProcessingBatchJobEnvironmentVariable.RedisHostName.value,
                "value": EnvVariable.REDIS_HOST_NAME.value,
            },
            {
                "name": ProcessingBatchJobEnvironmentVariable.SlackMetashapeErrorsWebhookUrl.value,
                "value": EnvVariable.SLACK_METASHAPE_ERRORS_WEBHOOK_URL.value,
            },
            {
                "name": ProcessingBatchJobEnvironmentVariable.SourceImagesBucket.value,
                "value": EnvVariable.SOURCE_IMAGES_BUCKET_NAME.value,
            },
            {
                "name": ProcessingBatchJobEnvironmentVariable.JobType.value,
                "value": JobType.ProcessTask.value,
            },
            {
                "name": ProcessingBatchJobEnvironmentVariable.TaskID.value,
                "value": str(task_id),
            },
        ]
    }
