from typing import Dict

from django.utils.functional import classproperty
from typing_extensions import Self

from shared.constants import BaseEnum


class FeatureFlag(BaseEnum):
    EMAIL_NOTIFICATION = "email_notification"
    GENERATE_ANALYTICS = "generate_analytics"
    MBTILES = "mbtiles"
    PROCESSING = "processing"
    PROCESSING_WORKFLOW = "processing_workflow"
    SLOPE_MAP = "slope_map"
    SWIPE_MAP_3D = "swipe_map_3d"
    HAUL_ROAD_ANALYTICS = "haul_road_analytics"
    SMART_DETECT_ANALYTICS = "smart_detect_analytics"

    # Properties.
    @classproperty
    def DEFAULTS(cls) -> Dict[str, bool]:
        """
        Contains default value for feature flags.
        """

        return {
            cls.EMAIL_NOTIFICATION.value: True,
            cls.GENERATE_ANALYTICS.value: False,
            cls.MBTILES.value: True,
            cls.PROCESSING.value: False,
            cls.PROCESSING_WORKFLOW.value: False,
            cls.SLOPE_MAP.value: True,
            cls.SWIPE_MAP_3D.value: False,
            cls.HAUL_ROAD_ANALYTICS.value: False,
            cls.SMART_DETECT_ANALYTICS.value: False,
        }

    @classproperty
    def URL_FLAGS(cls) -> Dict[str, Self]:
        """
        A dictionary mapping URL names to their corresponding feature flags.
        """

        return {
            "iteration-generate-analytics": cls.GENERATE_ANALYTICS,
        }

    @classproperty
    def VIEW_SET_FLAGS(cls) -> Dict[str, Self]:
        """
        A dictionary mapping viewset's basename to their corresponding feature flags.
        """

        return {
            "processing": cls.PROCESSING,
            "iteration-dataset": cls.PROCESSING_WORKFLOW,
            "geotag-images": cls.PROCESSING_WORKFLOW,
            "tasks": cls.PROCESSING_WORKFLOW,
            "gcps": cls.PROCESSING_WORKFLOW,
            "presets": cls.PROCESSING_WORKFLOW,
            "gcp-image-tags": cls.PROCESSING_WORKFLOW,
            "task": cls.PROCESSING_WORKFLOW,
            "failed-status-update": cls.PROCESSING_WORKFLOW,
            "analytics-haul-roads": cls.HAUL_ROAD_ANALYTICS,
            "analytics-smart-detects": cls.SMART_DETECT_ANALYTICS,
        }

    # Methods.
    @classmethod
    def get_default_values(cls):
        """
        Return a dictionary with default values for all feature flags.
        Use-case: in models
        """

        return cls.DEFAULTS

    @classmethod
    def choices(cls):
        return [(key.value, key.name.replace("_", " ")) for key in cls]
