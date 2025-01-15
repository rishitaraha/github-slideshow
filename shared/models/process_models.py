from datetime import timedelta

from django.db import models
from django_softdelete.models import DeletedManager, SoftDeleteManager, SoftDeleteModel

from ..constants import BatchJobStatus
from .base_models import BaseModel


class BatchJob(BaseModel, SoftDeleteModel):
    job_id = models.UUIDField(unique=True, null=True)
    status = models.CharField(
        max_length=20, choices=BatchJobStatus.choices(), null=True
    )
    started_at = models.DateTimeField(null=True)
    stopped_at = models.DateTimeField(null=True)
    log_stream_name = models.TextField(null=True, help_text="AWS CloudWatch log stream")
    provisioning_model = models.TextField(null=True, help_text="Example: EC2")
    instance_type = models.TextField(null=True, help_text="Example: g4dn.metal")
    v_cpus = models.TextField(null=True)
    storage = models.TextField(null=True)
    ram = models.TextField(null=True)
    swap = models.TextField(null=True)
    benchmarks = models.JSONField(null=True)
    env_variables = models.JSONField(
        help_text="""
            List of env variables with name and value.
            [
              {
                'name': 'NAME',
                'value': 'VALUE'
              }, ...
            ]
            """,
    )

    # Managers.
    objects = SoftDeleteManager()
    deleted_objects = DeletedManager()

    @property
    def time_taken(self) -> timedelta:
        """
        Calculate the time taken for the job to complete.

        Returns:
            timedelta: The time difference between the job's start and stop time.
                       If either is missing, returns None.
        """
        if self.started_at and self.stopped_at:
            return self.stopped_at - self.started_at

        return None

    def get_env_variable(self, name: str) -> dict:
        for env_variable in self.env_variables:
            if env_variable["name"] == name:
                return env_variable
