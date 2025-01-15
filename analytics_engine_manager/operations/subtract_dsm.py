from shared.aws import submit_analytics_job
from shared.connection import analytics_engine_api

from ..constants import AnalyticsEngineUrl, AnalyticsOperationName
from ..enum import IS_ANALYTICS_BATCH_ENABLED


def subtract_dsm(
    first_dsm_s3_key: str,
    second_dsm_s3_key: str,
    threshold_value: float,
    output_dsm_s3_key: str,
    update_status_url: str,
):
    """
    Subtracts one DSM from another.
    """

    data = {
        "first_dsm_s3_key": first_dsm_s3_key,
        "second_dsm_s3_key": second_dsm_s3_key,
        "output_dsm_s3_key": output_dsm_s3_key,
        "threshold_value": threshold_value,
        "update_status_url": update_status_url,
    }

    if IS_ANALYTICS_BATCH_ENABLED:
        data["operation"] = AnalyticsOperationName.SUBTRACT_DSM.value
        submit_analytics_job(AnalyticsOperationName.SUBTRACT_DSM.value, data)
    else:
        analytics_engine_api.post(AnalyticsEngineUrl.SUBTRACT_DSM.value, data=data)
