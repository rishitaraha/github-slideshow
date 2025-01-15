from enum import Enum


class FeatureType(Enum):
    TEXT_BOX = "TextBox"
    POINT = "Point"
    LINE_STRING = "LineString"
    POLYGON = "Polygon"

    @classmethod
    def choices(cls):
        return [(key.value, key.name) for key in cls]
