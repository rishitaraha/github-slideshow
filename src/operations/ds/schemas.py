from typing import Any, Optional

from pydantic import BaseModel
from typing_extensions import TypedDict


class SmartDetectOutput(TypedDict):
    layer_id: str
    type: str


class BaseDSImagePayload(BaseModel):
    DEBUG: str = "true"
    ENVIRONMENT: str = "platform"


class DSCommonPayload(BaseModel):
    smart_detect_id: str
    outputs: Any
    input_aoi_wkt: Optional[str] = None


class DSCommonDockerPayload(BaseDSImagePayload):
    WORKFLOW: str
    INPUT_AOI_SHAPEFILE_PATH: Optional[str] = None
    OUTPUT_FOLDER_PATH: str
