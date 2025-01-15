import copy

from shared.aws import submit_analytics_job
from shared.models import BatchJob

from ...constants import AnalyticsOperationName
from .schemas import ExecuteHRAPayloadSchema


def execute_hra(payload: ExecuteHRAPayloadSchema) -> BatchJob:
    data = copy.copy(payload)
    haul_road_name = data.pop("haul_road_name")
    data["operation"] = AnalyticsOperationName.HRA.value

    job_name = f"HRA-{haul_road_name}"
    return submit_analytics_job(job_name, data)
