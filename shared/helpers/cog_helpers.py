import json
from typing import Any, Dict, List, Union

from rest_framework.serializers import ValidationError
from rio_tiler.errors import PointOutsideBounds
from rio_tiler.io import COGReader

from rainbow import logger
from shared.exception_handling import ValidationErrors


def replace_nan_with_none(
    obj: Union[Dict[str, Any], List[Any], Any]
) -> Union[Dict[str, Any], List[Any], Any]:
    """
    Recursively replaces "NaN" values with None in a nested dictionary.
    """

    if isinstance(obj, dict):
        return {key: replace_nan_with_none(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [replace_nan_with_none(item) for item in obj]
    elif str(obj) == "nan":
        return None
    else:
        return obj


def get_cog_metadata(s3_key: str) -> Dict:
    """
    Extracts metadata from cog in S3.
    """

    cog_url = f"s3://{s3_key}"

    try:
        with COGReader(cog_url) as cog:
            histogram_options = {"bins": 255}
            percentiles = [2.0, 98.0]

            metadata = cog.statistics(
                percentiles=percentiles,
                hist_options=histogram_options,
            )

            info = cog.info()
            info = json.loads(info.json())

    except Exception as exception:
        logger.exception(msg="Failed to extract metadata.", exc_info=exception)

    if info["maxzoom"] < info["minzoom"]:
        info["maxzoom"] = info["minzoom"]

    if metadata:
        # Convert BandStatistics to dict.
        statistics = {}
        for band_key in metadata.keys():
            statistics[band_key] = json.loads(metadata[band_key].json())

        info["statistics"] = statistics

    # Bounds validation.
    default_bounding_box = [-180, -90, 180, 90]
    if not (bounds := info["bounds"]) or bounds == default_bounding_box:
        return None

    try:
        info = json.loads(json.dumps(info, allow_nan=False))
    except ValueError:
        # Replace NaN values with None in info, as NaN is not a valid JSON value.
        info = replace_nan_with_none(info)

    return info


def get_altitude_from_dsm_cog(
    s3_key: str, latitude: float, longitude: float
) -> int | None:
    """
    Fetch the altitude of a specific point from the DSM.

    Args:
        - s3_key: A string representing the key of the file in an S3 bucket that contains altitude data
        - latitude: A float representing the latitude of a location
        - longitude: A float representing the latitude of a location

    Returns: An integer representing the altitude or None if the altitude is not available.
    """

    cog_url = f"s3://{s3_key}"
    try:
        with COGReader(cog_url) as cog:
            point_data = cog.point(longitude, latitude)
            return point_data.array.tolist()[0]

    except PointOutsideBounds:
        return None

    except Exception as exception:
        logger.exception("Cog reader failed:", exc_info=exception, stack_info=True)
        raise ValidationError(ValidationErrors.INVALID_DSM_FILE.value)
