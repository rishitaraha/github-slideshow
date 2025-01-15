from shared.constants.enums import BaseEnum


class SmartDetectType(BaseEnum):
    BENCH_TOE_CREST = "bench_toe_crest"
    BUILDING_FOOTPRINTS_OR_ROOF_TOPS = "building_footprints_or_roof_tops"
    DRAINAGE_ANALYSIS = "drainage_analysis"
    HEAP_DETECTION = "heap_detection"
    METALLED_ROADS = "metalled_roads"
    PONDS_AND_LAKES = "ponds_and_lakes"
    RIVERS_AND_STREAMS = "rivers_and_streams"
    TREE_CANOPIES = "tree_canopies"
    UNMETALLED_ROADS = "unmetalled_roads"


class SmartDetectOutputLayerName(BaseEnum):
    # Deep learning outputs.
    LAKE = "Lake"
    METALLED_ROAD = "Metalled Road"
    POND = "Pond"
    RCC = "RCC"
    RIVER = "River"
    STREAM = "Stream"
    TILED_ROOF = "Tiled Roof"
    TIN_SHEET = "Tin Sheet"
    TREE_CANOPY = "Tree Canopy"
    UNMETALLED_ROAD = "UnMetalled Road"

    # Mine Analytics outputs.
    STREAMS = "Streams"
    HEAP_BOUNDARIES = "heap_boundaries"
    CRESTS = "Crests"
    TOES = "Toes"


class SmartDetectOperation(BaseEnum):
    DEEP_LEARNING_ANALYTICS = "deep_learning_analytics"
    MINE_ANALYTICS = "mine_analytics"


class SmartDetectWorkflow(BaseEnum):
    RURAL_FEATURE_DETECTION = "rural_feature_detection"
    TREE_CANOPY_DETECTION = "tree_canopy_detection"
    DRAINAGE_ANALYSIS = "drainage_analysis"
    HEAP_BOUNDARY_DETECTION = "heap_boundary_detection"
    BENCH_CREST_TOE_DETECTION = "bench_crest_toe_detection"
