from typing import Tuple, TypedDict

from osgeo.osr import SpatialReference


class RasterInfoSchema(TypedDict):
    bounds: Tuple[float, float, float, float]
    epsg: int
    geo_transform: Tuple[float, float, float, float, float, float]
    gsd: float
    metadata: dict
    nodata_value: int
    projection: str
    resolution: Tuple[float, float]
    shape: Tuple[int, int]
    srs: SpatialReference
    unit: str
