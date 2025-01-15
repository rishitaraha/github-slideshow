from enum import Enum

from .helpers import ApiError


class ApiErrors(Enum):
    FORM_VALIDATION_ERROR = ApiError(
        slug="form_validation_error",
        message="Form validation failed. Please enter valid input values",
    )
    INVALID_HISTOGRAM_SOURCE_DATA_BAND = ApiError(
        slug="invalid_histogram_source_data_band",
        message="There must be only one band in the source data to create a histogram.",
    )
    INVALID_PARAMETER = ApiError("Invalid Parameter", "invalid_parameter")

    INVALID_RESCALE_VALUE = ApiError(
        slug="invalid_rescale_value", message="Invalid rescale value"
    )
    INVALID_TILE_COORDINATES = ApiError(
        "Invalid tile coordinates.", "invalid_tile_coordinates"
    )
    METADATA_NOT_FOUND = ApiError(
        slug="metadata_not_found", message="Metadata not found"
    )
    POINT_OUTSIDE_DATASET_BOUNDS = ApiError(
        slug="point_outside_dataset_bounds", message="Point is outside dataset bounds"
    )
    SOMETHING_WENT_WRONG = ApiError(
        slug="something_went_wrong", message="Something went wrong"
    )
    TILE_NOT_FOUND = ApiError(slug="tile_not_found", message="Tile not found")
    TILE_OUTSIDE_BOUND = ApiError(
        slug="tile_outside_bound",
        message="Requested tile lies outside of dataset bound",
    )
