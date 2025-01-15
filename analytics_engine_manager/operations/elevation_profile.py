from typing import Dict, List

from shared.connection import analytics_engine_api

from ..constants import AnalyticsEngineUrl


def get_elevation_profile(iterations: List[Dict[str, str]], line_wkt: str):
    """
    Returns elevation profile of all iterations

    Args:
        - iterations: iterations will be list of dict of iteration_id and dsm_s3_key.
            [
                {
                    "id": "iteration_id",
                    "dsm_s3_key": "s3 key of dsm"
                },
            ]
        - line_wkt: Well Known Text of line
    """

    data = {
        "iterations": iterations,
        "line_string": line_wkt,
    }

    response = analytics_engine_api.post(
        AnalyticsEngineUrl.ELEVATION_PROFILE.value, data=data
    )

    response_json = response.json()
    response_data = response_json["data"]

    return response_data, response.status_code
