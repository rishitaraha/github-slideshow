from typing import List

from shared.connection import analytics_engine_api

from ..constants import AnalyticsEngineUrl


def generate_3d_shape_file(
    dsm_s3_keys: List[str], line_wkt: str, output_filename: str = None
):
    data = {
        "dsm_s3_keys": dsm_s3_keys,
        "line_string": line_wkt,
        "output_filename": output_filename,
    }

    response = analytics_engine_api.post(
        AnalyticsEngineUrl.GENERATE_3D_SHAPE_FILE.value, data=data
    )

    return response.content
