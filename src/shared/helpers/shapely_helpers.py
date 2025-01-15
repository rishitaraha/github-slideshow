import math
from typing import List, Tuple, Union

import numpy as np
import pyproj
import shapely.wkt
from shapely.geometry import LineString, Point, Polygon
from shapely.ops import transform

from ..constants import GeometryType


def transform_geometries(
    geometries_or_wkts: List[Union[str, LineString, Point, Polygon]],
    target_epsg: int,
    source_epsg: int = 4326,
) -> List[Union[LineString, Point, Polygon]]:
    """
    Changes the projection of multiple geometries or WKT strings.
    """
    source_crs = pyproj.CRS(f"EPSG:{source_epsg}")
    target_crs = pyproj.CRS(f"EPSG:{target_epsg}")

    project = pyproj.Transformer.from_crs(
        source_crs, target_crs, always_xy=True
    ).transform

    transformed_geometries = []
    for geometry_or_wkt in geometries_or_wkts:
        if isinstance(geometry_or_wkt, str):
            # Create shapely geometry from WKT
            geometry = shapely.wkt.loads(geometry_or_wkt)
        else:
            geometry = geometry_or_wkt

        transformed_geometry = transform(project, geometry)
        transformed_geometries.append(transformed_geometry)

    return transformed_geometries


def haversine_linestring_length(linestring: LineString):
    """
    Calculate the length of linestring using Haversine Formula.
    Returns the length in meters.
    """
    coordinates = linestring.coords

    # Volumetric mean radius of earth: https://en.wikipedia.org/wiki/Earth_radius.
    radius_of_earth_in_meters = 6371000
    total_distance_in_meters = 0
    # Calculate the Haversine distance between each pair of consecutive points in degrees.
    for i in range(len(coordinates) - 1):
        lat1, lon1 = math.radians(coordinates[i][1]), math.radians(coordinates[i][0])
        lat2, lon2 = math.radians(coordinates[i + 1][1]), math.radians(
            coordinates[i + 1][0]
        )

        # Haversine fomula: https://en.wikipedia.org/wiki/Haversine_formula.
        # Ref: https://stackoverflow.com/a/4913653.
        # Ref: http://www.movable-type.co.uk/scripts/latlong.html
        diff_lat, diff_lon = lat2 - lat1, lon2 - lon1

        # Square of half the chord length between current two points.
        chord_length = (
            math.sin(diff_lat / 2) ** 2
            + math.cos(lat1) * math.cos(lat2) * math.sin(diff_lon / 2) ** 2
        )

        # Angular distance between current two points in radians.
        arc_length_in_radians = 2 * math.asin(math.sqrt(chord_length))

        total_distance_in_meters += arc_length_in_radians * radius_of_earth_in_meters

    return total_distance_in_meters


def segmentize_line(
    linestring: LineString,
    segment_length: float,
    linestring_epsg: int = 4326,
    segment_length_epsg: int = 3857,
) -> Tuple[LineString, list[float]]:
    """
    Returns a segmentized linestring in EPSG:4326 and a list of each segment
    point distance in meters.

    All segments in the linestring will be of equal length except the last one,
    which will be less than `segment_length`.

    Arguments:
        - linestring: LineString geometry
        - segment_length: Maximum segment length in meters or
            degrees(if segment length projection is EPSG:4326)
        - linestring_epsg: EPSG value of input linestring
    """

    # Convert geometry to EPSG:4326 for accurate length.
    if linestring_epsg != 4326:
        linestring = transform_geometries(
            [linestring], target_epsg=4326, source_epsg=linestring_epsg
        )[0]

    linestring_length_in_meters = haversine_linestring_length(linestring)

    # Assuming that if segment length projection is not EPSG:4326, then it will be in meters.
    if segment_length_epsg == 4326:
        # Converting degrees to meters.
        # Ref: https://sciencing.com/convert-latitude-longtitude-feet-2724.html.
        segment_length *= 111139
        # This conversion is inaccurate for bigger values but here segment length is assumed to be small.

    # Ref: https://stackoverflow.com/a/62994304.
    # Segmentize linestring according to the segment ratio.
    segment_ratio = segment_length / linestring_length_in_meters
    linestring_length_in_degrees = linestring.length

    # Adding final bound as length of the linestring.
    distances_in_degrees = np.arange(
        0, linestring_length_in_degrees, linestring_length_in_degrees * segment_ratio
    ).tolist() + [linestring_length_in_degrees]

    # Segmentize linestring.
    segment_points = [
        linestring.interpolate(distance) for distance in distances_in_degrees
    ]

    # Calculate distances in meters at segment length interval.
    distances_in_meters = np.arange(
        0, linestring_length_in_meters, segment_length
    ).tolist() + [linestring_length_in_meters]
    return LineString(segment_points), distances_in_meters


def validate_wkt(wkt_string: str, geometry_type: GeometryType | None = None) -> None:
    try:
        geometry = shapely.wkt.loads(wkt_string)
    except Exception:
        raise Exception("Invalid WKT")

    # Checking if WKT string represent a valid geometry.
    if not geometry.is_valid:
        raise Exception("Invalid WKT")

    # Checking if the WKT geometry type is same as required geometry type.
    if geometry_type and geometry.geom_type != geometry_type.value:
        raise Exception("Invalid geometry type for wkt string")
