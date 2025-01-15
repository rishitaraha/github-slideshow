from typing import Type

from django.db.models import Model
from django.dispatch import receiver
from fieldsignals import post_save_changed

from rainbow import logger

from ..aws import AwsManager
from ..constants import BatchJobStatus, FileStatus
from ..models import BatchJob, FileInfo
from .enums import BatchJobSignalUID, FileInfoSignalUID


def update_batch_job_details(batch_job: BatchJob):
    """
    Retrieve batch job details from AWS and update the instance accordingly.

    Args:
        batch_job: The BatchJob instance to update.
    """

    batch_job_details = AwsManager.get_job_details(str(batch_job.job_id))
    if not batch_job_details:
        return

    batch_job.started_at = batch_job_details.get("started_at")
    batch_job.stopped_at = batch_job_details.get("stopped_at")
    batch_job.log_stream_name = batch_job_details.get("log_stream_name")
    batch_job.provisioning_model = batch_job_details.get("provisioning_model")
    batch_job.v_cpus = batch_job_details.get("v_cpus")
    batch_job.ram = batch_job_details.get("ram")
    batch_job.instance_type = batch_job_details.get("instance_type", None)

    # Save the updated instance to the database.
    batch_job.save(
        update_fields=[
            "started_at",
            "stopped_at",
            "log_stream_name",
            "provisioning_model",
            "instance_type",
            "v_cpus",
            "ram",
        ]
    )
    logger.info(
        f"Job details updated successfully for batch job with id: {batch_job.id}"
    )


@receiver(
    post_save_changed,
    sender=FileInfo,
    fields=["status"],
    dispatch_uid=FileInfoSignalUID.FETCH_BATCH_JOB_DETAILS.value,
)
def fetch_file_info_batch_job_details(
    sender: Type[Model], instance: FileInfo, **kwargs
):
    """
    This signal is responsible for extracting the details of file_info's batch job.

    Fetch batch job details only if:
        - file status is done
        - batch job for the file exists

    """

    if instance.status != FileStatus.DONE.value or instance.batch_job is None:
        return

    update_batch_job_details(instance.batch_job)


# TODO: Remove this signal after DSM as layer
@receiver(
    post_save_changed,
    sender=BatchJob,
    fields=["status"],
    dispatch_uid=BatchJobSignalUID.FETCH_BATCH_JOB_DETAILS.value,
)
def fetch_batch_job_details(sender: Type[Model], instance: BatchJob, **kwargs):
    """
    This signal is responsible for extracting the details from the batch jobs.

    Note: This job will run only for terrain_tiles and dsm_cog jobs as iteration model uses batch job models directly to store the file info and status for dsm_cog and terrain tiles.

    Fetch details from batch job only if:
        - batch job status is completed

    """

    if instance.status != BatchJobStatus.COMPLETED.value:
        return

    update_batch_job_details(instance)
