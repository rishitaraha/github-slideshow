from typing import TypedDict
from uuid import UUID


class JobOutputSchema(TypedDict):
    jobArn: str
    jobName: str
    jobId: UUID


class JobDetails(TypedDict):
    started_at: str
    stopped_at: str
    log_stream_name: str
    provisioning_model: str
    instance_type: str
    v_cpus: str
    ram: str


class S3ObjectLocation(TypedDict):
    bucket: str
    key: str
