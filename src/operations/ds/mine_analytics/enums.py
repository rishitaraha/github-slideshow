from enum import Enum


class MineAnalyticsWorkflow(Enum):
    DRAINAGE_ANALYSIS = "drainage_analysis"
    HEAP_BOUNDARY_DETECTION = "heap_boundary_detection"
    BENCH_CREST_TOE_DETECTION = "bench_crest_toe_detection"


class MineAnalyticsOutputs(Enum):
    HEAP_BOUNDARIES = "heap_boundaries"
    STREAMS = "Streams"
    CRESTS = "Crests"
    TOES = "Toes"

    @classmethod
    def values(cls):
        return [hra_output.value for hra_output in cls]

    @classmethod
    def are_valid_members(cls, outputs):
        """
        Checks if all the strings in the given list are valid members of the enum.

        Args:
            - outputs: List of strings to check.
        Returns:
            Tuple (is_valid, invalid_items):
                - is_valid (bool): True if all items are valid, False otherwise.
                - invalid_items (list): List of invalid items if any.
        """
        enum_values = cls.values()
        invalid_items = [output for output in outputs if output not in enum_values]
        return len(invalid_items) == 0, invalid_items


class HRAWorkflow(Enum):
    HRD_FROM_SMART_LINE = "hrd_from_smart_line"
    HRD_FROM_CENTER_LINE = "hrd_from_center_line"
    HRA_FROM_INPUT_EDGES = "hra_from_input_edges"


class HRAOutputs(Enum):
    CENTER_LINE = "Centerline"
    EDGES = "Edges"
    GRADIENT_ANALYSIS = "Gradient Analysis"
    MEDIANS = "Medians"
    WIDTH_ANALYSIS = "Width Analysis"

    @classmethod
    def values(cls):
        return [hra_output.value for hra_output in cls]


class HaulRoadLayerType(Enum):
    CENTER_LINE = "center_line"
    CROSS_SLOPE_ANALYSIS = "cross_slope_analysis"
    EDGES = "edges"
    GRADIENT_ANALYSIS = "gradient_analysis"
    MEDIANS = "medians"
    WIDTH_ANALYSIS = "width_analysis"


hra_output_to_layer_type_mapping = {
    HRAOutputs.CENTER_LINE.value: HaulRoadLayerType.CENTER_LINE.value,
    HRAOutputs.EDGES.value: HaulRoadLayerType.EDGES.value,
    HRAOutputs.GRADIENT_ANALYSIS.value: HaulRoadLayerType.GRADIENT_ANALYSIS.value,
    HRAOutputs.WIDTH_ANALYSIS.value: HaulRoadLayerType.WIDTH_ANALYSIS.value,
    HRAOutputs.MEDIANS.value: HaulRoadLayerType.MEDIANS.value,
}
