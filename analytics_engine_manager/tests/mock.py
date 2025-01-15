from rest_framework import status

from shared.tests.mock import create_test_zipfile


def mocked_volume_calculation():
    return {
        "cut_volume": 518651.65,
        "fill_volume": 218.26,
        "net_volume": 518433.391,
    }, status.HTTP_200_OK


def mocked_elevation_profile():
    return [
        {
            "iteration": "29a8e5b2-5a13-4930-a5e9-67a7e8e16314",
            "elevation_profile": [[0.0, 136.0], [1.0, 167.25], [2.0, 135.02]],
        }
    ], status.HTTP_200_OK


def mocked_generate_3d_shape_file():
    return create_test_zipfile()


def mocked_dsm_metadata():
    return {
        "crs": "EPSG:32634",
        "origin": [699960.0, 3600000.0],
        "resolution": [10.0, -10.0],
        "bounding_box": [699960.0, 3490200.0, 809760.0, 3600000.0],
        "min_elevation": 10,
        "max_elevation": 100,
    }
