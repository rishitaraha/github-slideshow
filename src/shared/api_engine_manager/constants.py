from enum import Enum


class Status(Enum):
    IMPORTING = "importing"
    IMPORT_FAILED = "import_failed"
    STARTED = "started"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"


class ClampToTerrainStatus(Enum):
    NOT_CLAMPED = "not_clamped"
    ALREADY_CLAMPED = "already_clamped"
    STARTED = "started"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"


class VectorFileFormat(Enum):
    SHAPEFILE = "shp"
    DXF = "dxf"
    KML = "kml"
    GPKG = "gpkg"
