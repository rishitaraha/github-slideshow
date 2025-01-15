from typing import Optional, TypedDict

from .constants import HRAWorkflow


class ExecuteHRAPayloadSchema(TypedDict):
    haul_road_id: str
    haul_road_name: str
    workflow: HRAWorkflow
    input_linestring_wkt: str
    input_dtm_path: str
    input_medians_layer_id: Optional[str]
    chainage_distance: float
    vehicle_width: float
