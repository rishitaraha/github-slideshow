import pyproj
from django.contrib.gis.geos import Point
from django.db import connection
from psycopg2.extensions import AsIs


# TODO: Move to shared folder.
def copy_from_csv_buffer(*, table_name, columns, in_mem_buffer):
    params = {"table_name": AsIs(table_name), "columns": AsIs(columns)}
    try:
        raw_query = """
                COPY %(table_name)s (%(columns)s)
                FROM STDIN
                WITH CSV HEADER
            """
        with connection.cursor() as cursor:
            res = cursor.mogrify(raw_query, params)
            cursor.copy_expert(
                res.decode(),
                in_mem_buffer,
            )
    except Exception as exc:
        raise Exception(exc)


def convert_to_wgs84_transformer(utm_srid):
    utm_crs = pyproj.CRS.from_epsg(utm_srid)
    wgs84_crs = pyproj.CRS.from_epsg(4326)
    transformer = pyproj.Transformer.from_crs(utm_crs, wgs84_crs)
    return transformer


def wgs84_point(transformer, easting, northing, altitude):
    longitude, latitude = transformer.transform(easting, northing)
    return Point(longitude, latitude, altitude)
