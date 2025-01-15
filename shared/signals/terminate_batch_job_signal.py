from django.dispatch import receiver
from fieldsignals import post_save_changed
from rest_framework.status import HTTP_200_OK

from rainbow import logger

from ..aws import AwsManager
from ..constants import BatchJobStatus, FileStatus
from ..models import BatchJob, FileInfo
from .enums import BatchJobSignalUID, FileInfoSignalUID


def terminate_batch_job(job_id: str, reason: str):
    response_status_code = AwsManager.terminate_batch_job(str(job_id), reason)

    if response_status_code == HTTP_200_OK:
        logger.info("Batch job terminated")
    else:
        logger.error(f"Batch job termination failed for the job id {job_id}")


# TODO: Remove this signal after moving captured dsm to layer.
@receiver(
    post_save_changed,
    sender=BatchJob,
    fields=["is_deleted"],
    dispatch_uid=BatchJobSignalUID.TERMINATE_BATCH_JOB_ON_DELETE.value,
)
def terminate_batch_jobs_on_delete(sender, instance: BatchJob, **kwargs):
    """
    This signal is responsible for terminating the running batch jobs.

    Terminate batch job only if:
        - BatchJob instance status is not completed or failed
        - BatchJob instance is deleted
    """
    if (
        instance.status in [BatchJobStatus.COMPLETED.value, BatchJobStatus.FAILED.value]
        or not instance.is_deleted
    ):
        return

    terminate_batch_job(instance.job_id, "File deleted")


@receiver(
    post_save_changed,
    sender=FileInfo,
    fields=["is_deleted"],
    dispatch_uid=FileInfoSignalUID.TERMINATE_BATCH_JOB_ON_DELETE.value,
)
def terminate_batch_job_on_soft_delete(sender, instance: FileInfo, **kwargs):
    """
    This signal is responsible for terminating the running batch jobs of deleted files.

    Terminate batch job only if:
        - file status is not done or failed
        - file is deleted
        - and batch job for the file is present.
    """
    if (
        instance.status in [FileStatus.DONE.value, FileStatus.FAILED.value]
        or not instance.is_deleted
        or instance.batch_job is None
    ):
        return

    terminate_batch_job(instance.batch_job.job_id, "File deleted")
