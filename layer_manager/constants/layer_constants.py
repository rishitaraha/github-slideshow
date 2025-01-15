from enum import Enum

from shared.constants import BaseEnum


class LayerType(Enum):
    CESIUM = "cesium"
    MAPBOX = "mapbox"
    ORTHOMOSAIC = "orthomosaic"
    VECTOR = "vector"
    MBTILES = "mbtiles"
    CONTOUR = "contour"
    SLOPE_MAP = "slope_map"

    @classmethod
    def choices(cls):
        return [(key.value, key.name) for key in cls]


class AreaCategory(Enum):
    OTHER = "other"
    PLANNED_AND_ACTIVE = "planned_and_active"
    PLANNED_AND_INACTIVE = "planned_and_inactive"
    UNPLANNED_AND_ACTIVE = "unplanned_and_active"
    UNPLANNED_AND_ACTIVE_BEYOND_CRITICAL_BOUNDARY = (
        "unplanned_and_active_beyond_critical_boundary"
    )

    @classmethod
    def choices(cls):
        return [(key.value, key.name) for key in cls]


class VectorFileFormat(Enum):
    SHAPEFILE = "shp"
    DXF = "dxf"
    KML = "kml"
    GPKG = "gpkg"


class LayerFileFormat(Enum):
    SHAPEFILE = "shp"
    DXF = "dxf"
    KML = "kml"
    GPKG = "gpkg"
    TIF = "tif"


class ClampToTerrainStatus(BaseEnum):
    NOT_CLAMPED = "not_clamped"
    ALREADY_CLAMPED = "already_clamped"
    STARTED = "started"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"
