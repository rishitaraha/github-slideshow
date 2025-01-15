from typing import Optional

from pydantic import BaseModel

from ..schemas import BaseDSImagePayload, DSCommonDockerPayload, DSCommonPayload
from .enums import HRAWorkflow, MineAnalyticsWorkflow


class HRAPayload(BaseModel):
    chainage_distance: float
    haul_road_id: str
    input_dtm_path: str
    input_linestring_wkt: str
    vehicle_width: float
    workflow: HRAWorkflow
    input_medians_layer_id: Optional[str] = None


class HRADockerPayload(BaseDSImagePayload):
    CHAINAGE_DISTANCE: float
    INPUT_DTM_PATH: str
    INPUT_LINESTRING_SHAPEFILE_PATH: str
    VEHICLE_WIDTH: float
    WORKFLOW: str
    INPUT_MEDIAN_FILE_PATH: Optional[str] = None


class MineAnalyticsPayload(DSCommonPayload):
    workflow: MineAnalyticsWorkflow
    input_dem_s3_uri: str


class MineAnalyticsDockerPayload(DSCommonDockerPayload):
    INPUT_DTM_PATH: str
