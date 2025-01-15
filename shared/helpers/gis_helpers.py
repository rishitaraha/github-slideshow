import copy
import json

from django.contrib.gis.geos import GEOSGeometry
from shapely import ops, wkt


def convert_geojson_to_geometry(geometry: str) -> GEOSGeometry:
    geojson = json.loads(geometry)["geometry"]
    geojson_string = json.dumps(geojson)
    return GEOSGeometry(geojson_string)


def get_polygon_area(geometry: GEOSGeometry) -> float:
    # Create a copy of the geometry before applying any transformations to ensure that the original geometry remains unaltered.
    geom = copy.copy(geometry)

    # Inplace transformation.
    geom.transform(3857)
    polygon_area = round(geom.area, 2)
    return polygon_area


def convert_geometry_2d_to_3d(geometry: GEOSGeometry) -> GEOSGeometry:
    if geometry.hasz:
        return geometry

    return ops.transform(lambda x, y: (x, y, 0), wkt.loads(geometry.wkt)).wkt


def convert_geometry_3d_to_2d(geometry: GEOSGeometry) -> GEOSGeometry:
    if not geometry.hasz:
        return geometry

    return ops.transform(lambda x, y, z=None: (x, y), wkt.loads(geometry.wkt))


def parse_postgis_box(box_wkt: str) -> tuple[float, float, float, float]:
    """
    Parses a PostGIS BOX string and returns a tuple of coordinates.

    Args:
        box_wkt (str): PostGIS BOX string in the format "BOX(min_x min_y, max_x max_y)".
    Returns: A tuple of coordinates (min_x, min_y, max_x, max_y).
    """

    bounding_box = box_wkt[4:-1].replace(" ", ",").split(",")

    return tuple(map(float, bounding_box))
