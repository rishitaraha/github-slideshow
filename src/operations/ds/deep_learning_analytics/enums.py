from enum import Enum


class DeepLearningAnalyticsWorkflow(Enum):
    RURAL_FEATURE_DETECTION = "rural_feature_detection"
    TREE_CANOPY_DETECTION = "tree_canopy_detection"


class DeepLearningAnalyticsOutputs(Enum):
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
