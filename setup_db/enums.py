from enum import Enum

class FileType(Enum):
    BASE_DSM = "base_dsm"
    CAPTURED_DSM = "captured_dsm"
    CAPTURED_DSM_COG = "captured_dsm_cog"
    LEGEND_IMAGE = "legend_image"
    MBTILES = "mbtiles"
    ORG_LOGO = "org_logo"
    ORTHOMOSAIC = "orthomosaic"
    ORTHOMOSAIC_COG = "orthomosaic_cog"
    SLOPE_MAP = "slope_map"
    TERRAIN_TILES = "terrain_tiles"
    VECTOR_TILES = "vector_tiles"
    VECTORS = "vectors"

class LayerType(Enum):
    CESIUM = "cesium"
    MAPBOX = "mapbox"
    ORTHOMOSAIC = "orthomosaic"
    VECTOR = "vector"
    MBTILES = "mbtiles"
    CONTOUR = "contour"
    SLOPE_MAP = "slope_map"

