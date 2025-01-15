import copy

from rainbow.env_variables import EnvVariable
from shared.aws import submit_analytics_job, submit_mbtiles_extractor_job

from ..constants import AnalyticsOperationName
from ..schemas import MbTilesExtractorPayloadSchema

# Check if MBTiles job is present in the current env.
IS_MBTILE_JOB_PRESENT = (
    EnvVariable.AWS_BATCH_MBTILES_JOB_QUEUE.value is not None
    and EnvVariable.AWS_BATCH_MBTILES_JOB_DEFINITION.value is not None
)


def extract_mbtiles(payload: MbTilesExtractorPayloadSchema) -> None:
    """
    Submits a job to extract MBTiles based on the job presence status.

    Args:
        job_name (str): The name of the job to be processed.
        payload (MbTilesExtractorPayloadSchema): The payload containing the necessary data for extraction.
    """

    if IS_MBTILE_JOB_PRESENT:

        submit_mbtiles_extractor_job(
            AnalyticsOperationName.EXTRACT_MBTILE.value, payload
        )
    else:

        data = copy.copy(payload)
        data["operation"] = AnalyticsOperationName.EXTRACT_MBTILE.value

        submit_analytics_job(AnalyticsOperationName.EXTRACT_MBTILE.value, data)
