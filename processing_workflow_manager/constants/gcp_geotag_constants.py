from shared.constants import BaseEnum


class GeotagRotationAngle(BaseEnum):
    OMEGA_PHI_KAPPA = "omega_phi_kappa"
    YAW_PITCH_ROLL = "yaw_pitch_roll"


class GCPType(BaseEnum):
    CONTROLPOINT = "controlpoint"
    CHECKPOINT = "checkpoint"


class GCPFileUploadAction(BaseEnum):
    APPEND = "append"
    REPLACE = "replace"
    NONE = "none"


class GeotagImageColumnField(BaseEnum):
    LATITUDE = "latitude"
    LATITUDE_ACCURACY = "latitude_accuracy"
    LONGITUDE_ACCURACY = "longitude_accuracy"
    LONGITUDE = "longitude"
    NORTHING = "northing"
    NORTHING_ACCURACY = "northing_accuracy"
    EASTING = "easting"
    EASTING_ACCURACY = "easting_accuracy"
    ALTITUDE = "altitude"
    HORIZONTAL_ACCURACY = "horizontal_accuracy"
    VERTICAL_ACCURACY = "vertical_accuracy"
    OMEGA = "omega"
    OMEGA_ACCURACY = "omega_accuracy"
    PHI = "phi"
    PHI_ACCURACY = "phi_accuracy"
    KAPPA = "kappa"
    KAPPA_ACCURACY = "kappa_accuracy"
    YAW = "yaw"
    YAW_ACCURACY = "yaw_accuracy"
    PITCH = "pitch"
    PITCH_ACCURACY = "pitch_accuracy"
    ROLL = "roll"
    ROLL_ACCURACY = "roll_accuracy"
    NONE = "none"
    FILENAME = "filename"
    X_COORDINATE = "x_coordinate"
    Y_COORDINATE = "y_coordinate"
    Z_COORDINATE = "z_coordinate"
    X_ACCURACY = "x_accuracy"
    Y_ACCURACY = "y_accuracy"
    Z_ACCURACY = "z_accuracy"
    LOCATION_WGS84 = "location_wgs84"


class GCPColumnField(BaseEnum):
    LABEL = "label"
    LATITUDE = "latitude"
    LONGITUDE = "longitude"
    NORTHING = "northing"
    EASTING = "easting"
    ALTITUDE = "altitude"


class GCPImageTagType(BaseEnum):
    UNTAGGED = "untagged"
    TAGGED = "tagged"
    APPROX_TAG = "approx_tag"


# TODO: Move to shared folder.
class CoordinateBound(BaseEnum):
    LATITUDE_LOWER_BOUND = -90
    LATITUDE_UPPER_BOUND = 90
    LONGITUDE_LOWER_BOUND = -180
    LONGITUDE_UPPER_BOUND = 180
    NORTHING_LOWER_BOUND = 0
    NORTHING_UPPER_BOUND = 10000000
    EASTING_LOWER_BOUND = 0
    EASTING_UPPER_BOUND = 1000000
    ALTITUDE_LOWER_BOUND = -100
    ALTITUDE_UPPER_BOUND = 10000


# TODO: Move to shared folder.
COORDINATE_BOUND_MAPPING = {
    GeotagImageColumnField.NORTHING.value: (
        CoordinateBound.NORTHING_LOWER_BOUND.value,
        CoordinateBound.NORTHING_UPPER_BOUND.value,
    ),
    GeotagImageColumnField.EASTING.value: (
        CoordinateBound.EASTING_LOWER_BOUND.value,
        CoordinateBound.EASTING_UPPER_BOUND.value,
    ),
    GeotagImageColumnField.LATITUDE.value: (
        CoordinateBound.LATITUDE_LOWER_BOUND.value,
        CoordinateBound.LATITUDE_UPPER_BOUND.value,
    ),
    GeotagImageColumnField.LONGITUDE.value: (
        CoordinateBound.LONGITUDE_LOWER_BOUND.value,
        CoordinateBound.LONGITUDE_UPPER_BOUND.value,
    ),
    GeotagImageColumnField.ALTITUDE.value: (
        CoordinateBound.ALTITUDE_LOWER_BOUND.value,
        CoordinateBound.ALTITUDE_UPPER_BOUND.value,
    ),
}


class GeotagImageEntity(BaseEnum):
    GEOTAG_DATA = "geotag_data"
    IMAGE_DATA = "image_data"
    GEOTAG_IMAGE = "geotag_image"


GEOTAG_DATA_FIELDS = (
    "x_coordinate",
    "y_coordinate",
    "z_coordinate",
    "x_accuracy",
    "y_accuracy",
    "location_wgs84",
    "horizontal_accuracy",
    "vertical_accuracy",
    "omega",
    "omega_accuracy",
    "phi",
    "phi_accuracy",
    "kappa",
    "kappa_accuracy",
    "yaw",
    "yaw_accuracy",
    "pitch",
    "pitch_accuracy",
    "roll",
    "roll_accuracy",
)
