from shared.constants import BaseEnum


class HaulRoadLayerType(BaseEnum):
    CENTER_LINE = "center_line"
    EDGES = "edges"
    GRADIENT_ANALYSIS = "gradient_analysis"
    WIDTH_ANALYSIS = "width_analysis"
    MEDIANS = "medians"
    CROSS_SLOPE_ANALYSIS = "cross_slope_analysis"


class HaulRoadRiskAnalysisType(BaseEnum):
    GRADIENT_ANALYSIS = "gradient_analysis"
    WIDTH_ANALYSIS = "width_analysis"


class UnitOfRange(BaseEnum):
    DEGREES = "degrees"
    METERS = "meters"
