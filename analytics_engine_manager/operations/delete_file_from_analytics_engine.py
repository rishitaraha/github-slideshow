from analytics_engine_manager.constants import AnalyticsEngineUrl
from shared.connection import analytics_engine_api


def delete_file_from_analytics_engine_efs(file_s3_key):
    """
    Deletes the file from analytics engine efs.
    """

    data = {"file_s3_key": file_s3_key}
    response = analytics_engine_api.delete(
        AnalyticsEngineUrl.DELETE_FILE.value, data=data
    )
    return response.text, response.status_code
