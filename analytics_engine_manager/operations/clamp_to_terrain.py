import copy

from shared.aws import submit_analytics_job
from shared.connection import analytics_engine_api

from ..constants import AnalyticsEngineUrl, AnalyticsOperationName
from ..enum import IS_ANALYTICS_BATCH_ENABLED
from ..schemas import ClampToTerrainRequestPayloadSchema


def start_feature_clamping(payload: ClampToTerrainRequestPayloadSchema):
    if IS_ANALYTICS_BATCH_ENABLED:
        data = copy.copy(payload)
        data["operation"] = AnalyticsOperationName.CLAMP_TO_TERRAIN.value

        submit_analytics_job(AnalyticsOperationName.CLAMP_TO_TERRAIN.value, data)
    else:
        analytics_engine_api.post(
            AnalyticsEngineUrl.CLAMP_TO_TERRAIN.value, data=payload
        )
