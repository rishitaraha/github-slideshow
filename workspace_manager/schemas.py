from typing import Optional, TypedDict


class HRARiskRangeSchema(TypedDict):
    min_value: float
    max_value: float
    risk_category: str
    color: str


class HaulRoadAttributeSchema(TypedDict):
    chain_id: int
    patch_name: Optional[str]
    start_elev: Optional[str]
    end_elev: Optional[str]
    gradient: Optional[str]
    gradient_x: Optional[str]
    chain_name: str
    width: str
    chainwidth: str
    chain_dist: str
    gradient_risk_category: Optional[str]
    width_risk_category: str
