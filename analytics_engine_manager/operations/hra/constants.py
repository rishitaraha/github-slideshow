from enum import Enum


class HRAWorkflow(Enum):
    HRD_FROM_SMART_LINE = "hrd_from_smart_line"
    HRD_FROM_CENTER_LINE = "hrd_from_center_line"
    HRA_FROM_INPUT_EDGES = "hra_from_input_edges"
