from typing import Tuple, TypedDict


class FeatureSchema(TypedDict):
    id: str
    geometry: str


class ClampToTerrainRequestPayloadSchema(TypedDict):
    layer_id: str
    bounds: Tuple[float, float, float, float]
    features: FeatureSchema
    dsm_s3_key: str


class MbTilesExtractorPayloadSchema(TypedDict):
    resource_id: str
    input_s3_uri: str
    output_s3_uri: str
    update_status_url: str
    update_properties_url: str
    org_name: str
    project_name: str
    site_name: str
    iteration_name: str
    layer_name: str
