from decimal import Decimal, InvalidOperation

from django.contrib.gis.geos import Point
from rest_framework import serializers

from processing_workflow_manager.constants import (
    COORDINATE_BOUND_MAPPING,
    GCPColumnField,
)
from shared.constants.gis import EPSG
from shared.exception_handling import ValidationErrors

from ..helpers import convert_to_wgs84_transformer, wgs84_point


def get_gcp_objects_from_file(
    *, gcp_file, srid, iteration_dataset=None, merged_dataset=None
):
    gcp_objects = []
    is_projected = srid != EPSG.WGS84.value
    is_projected_coordinate_mapping = {
        True: (
            GCPColumnField.EASTING.value,
            GCPColumnField.NORTHING.value,
        ),
        False: (
            GCPColumnField.LONGITUDE.value,
            GCPColumnField.LATITUDE.value,
        ),
    }
    x_col, y_col = is_projected_coordinate_mapping[is_projected]

    for line in gcp_file:

        if isinstance(line, bytes):
            try:
                line = line.decode()
            except UnicodeDecodeError:
                raise serializers.ValidationError(
                    {"gcp_file": f"invalid_gcp_data_found_in_line_{line}"}
                )

        # Skip invalid lines
        line = line.strip()
        if not line or line.startswith(("''", "..", "__", ",,")):
            continue

        # Parse and validate GCP data
        values = [value.strip() for value in line.split(",")]
        if len(values) != 4:
            raise serializers.ValidationError(
                {"gcp_file": ValidationErrors.INVALID_FILE_FORMAT.value}
            )

        gcp_label, *coordinates = values
        if not isinstance(gcp_label, str):
            raise serializers.ValidationError(
                {"gcp_file": ValidationErrors.INVALID_GCP_LABEL.value}
            )

        try:
            y, x, z = map(Decimal, coordinates)
        except InvalidOperation:
            raise serializers.ValidationError(
                {"gcp_file": ValidationErrors.INVALID_GCP_COORDINATES.value}
            )

        # Validate coordinate bounds
        x_in_bounds = (
            COORDINATE_BOUND_MAPPING[x_col][0]
            <= x
            <= COORDINATE_BOUND_MAPPING[x_col][1]
        )
        y_in_bounds = (
            COORDINATE_BOUND_MAPPING[y_col][0]
            <= y
            <= COORDINATE_BOUND_MAPPING[y_col][1]
        )
        if not (x_in_bounds and y_in_bounds):
            raise serializers.ValidationError(
                {"gcp_file": ValidationErrors.INVALID_GCP_COORDINATES.value}
            )

        if is_projected:
            transformer = convert_to_wgs84_transformer(utm_srid=srid)
            location_wgs84 = wgs84_point(
                transformer=transformer,
                easting=float(x),
                northing=float(y),
                altitude=float(z),
            )
        else:
            location_wgs84 = Point(x=float(x), y=float(y), z=float(z))

        gcp_objects.append(
            {
                "label": gcp_label,
                "iteration_dataset": (
                    iteration_dataset.id if iteration_dataset else None
                ),
                "merged_dataset": merged_dataset.id if merged_dataset else None,
                "x_coordinate": x,
                "y_coordinate": y,
                "z_coordinate": z,
                "location_wgs84": location_wgs84,
            }
        )

    return gcp_objects
