from typing import Optional, TypedDict

from ..schemas import S3ObjectLocation


class ContourGeneratorPayloadSchema(TypedDict):
    dsm_s3_key: str
    polygon_wkt: Optional[str]
    minor_interval: float
    major_interval: float
    lowest_elevation: float
    highest_elevation: float
    threshold_value: float
    filter_size: int
    gpkg_output_s3_key: str
    gpkg_update_status_url: str
    dxf_output_s3_key: str
    dxf_update_status_url: str


class ExportS3PayloadSchema(TypedDict):
    source: S3ObjectLocation
    destination: S3ObjectLocation
    update_status_url: str
