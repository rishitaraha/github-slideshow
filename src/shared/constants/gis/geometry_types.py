from enum import Enum


class GeometryType(Enum):
    POINT = "Point"
    LINE_STRING = "LineString"
    POLYGON = "Polygon"
    MULTI_POINT = "MultiPoint"
    MULTI_LINE_STRING = "MultiLineString"
    MULTI_POLYGON = "MultiPolygon"
    GEOMETRY_COLLECTION = "GeometryCollection"
    LINEAR_RING = "LinearRing"
    POINT_Z = "PointZ"

    @property
    def gdal_value(self):
        if self == GeometryType.POINT:
            return 1
        elif self == GeometryType.LINE_STRING:
            return 2
        elif self == GeometryType.POLYGON:
            return 3
        elif self == GeometryType.MULTI_POINT or self == GeometryType.LINEAR_RING:
            return 4
        elif self == GeometryType.MULTI_LINE_STRING:
            return 5
        elif self == GeometryType.MULTI_POLYGON:
            return 6
        elif self == GeometryType.GEOMETRY_COLLECTION:
            return 7
        elif self == GeometryType.POINT_Z:
            return 1001
