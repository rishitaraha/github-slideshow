from ..schemas import DSCommonDockerPayload, DSCommonPayload
from .enums import DeepLearningAnalyticsWorkflow


class DeepLearningAnalyticsPayload(DSCommonPayload):
    workflow: DeepLearningAnalyticsWorkflow
    input_ortho_s3_uri: str


class DeepLearningAnalyticsDockerPayload(DSCommonDockerPayload):
    INPUT_TIFF_PATH: str
