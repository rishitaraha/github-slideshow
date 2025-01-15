from enum import Enum


class AnalyticsEngineUrl(Enum):
    CLAMP_TO_TERRAIN = "/clamp-to-terrain/"
    DELETE_FILE = "/delete-file/"
    DSM_METADATA = "/dsm-metadata/"
    ELEVATION_PROFILE = "/elevation-profile/"
    GENERATE_3D_SHAPE_FILE = "/generate-3d-shape-file/"
    PING = "/ping"
    SUBTRACT_DSM = "/subtract-dsm/"
    VOLUME_CALCULATION = "/volume-calculation/"


class AnalyticsOperationName(Enum):
    CLAMP_TO_TERRAIN = "clamp_to_terrain"
    SUBTRACT_DSM = "subtract_dsm"
    EXTRACT_MBTILE = "extract_mbtile"
    HRA = "hra"
