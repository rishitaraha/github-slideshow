from typing import Union

from shared.connection import analytics_engine_api

from ..constants import AnalyticsEngineUrl


def calculate_volume(
    iteration_id: str,
    dsm_s3_key: str,
    heap_multi_polygon_wkt: str,
    base_dsm_s3_key: Union[str, None] = None,
):
    """
    Calculates volume of a heap
    """
    data = {
        "iteration_id": iteration_id,
        "actual_dsm_s3_key": dsm_s3_key,
        "heap_multipolygon_wkt": heap_multi_polygon_wkt,
    }

    if base_dsm_s3_key:
        data["base_dsm_s3_key"] = base_dsm_s3_key

    response = analytics_engine_api.post(
        AnalyticsEngineUrl.VOLUME_CALCULATION.value, data=data
    )
    response_json = response.json()
    response_data = response_json["data"]
    return response_data, response.status_code
