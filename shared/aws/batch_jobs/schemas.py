from typing import TypedDict


class BaseBatchJobPayloadSchema(TypedDict):
    resource_id: str
    input_s3_uri: str
    output_s3_uri: str
    update_status_url: str
    update_properties_url: str
    org_name: str
    project_name: str
    site_name: str
    iteration_name: str


# TODO: Added project, site and iteration name in all batch job.
class VectorTilesGeneratorPayloadSchema(BaseBatchJobPayloadSchema):
    layer_name: str


class MbTilesExtractorPayloadSchema(BaseBatchJobPayloadSchema):
    layer_name: str


class TerrainTileGeneratorPayloadSchema(BaseBatchJobPayloadSchema):
    pass


class CogGeneratorPayloadSchema(BaseBatchJobPayloadSchema):
    pass


class SlopeMapGeneratorPayloadSchema(BaseBatchJobPayloadSchema):
    layer_name: str
