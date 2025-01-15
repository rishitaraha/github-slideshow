from enum import Enum

from ..helpers import ApiError


# In validation error, we provide field name to avoid non_field_errors.
class ValidationErrors(Enum):
    ACCESS_TAG_REQUIRED = ApiError("Access Tag is required.", "access_tag_is_required")
    ALL_FEATURES_MUST_HAVE_SAME_LAYER = ApiError(
        "All features should belong to the same layer",
        "all_features_must_have_same_layer",
    )
    ALL_HEAPS_MUST_HAVE_SAME_ITERATION = ApiError(
        "All heaps should belong to the same iteration",
        "all_heaps_must_have_same_iteration",
    )
    BASE_ITERATION_IS_REQUIRED_FOR_HEAP = ApiError(
        "Base iteration is required for heap when other-iteration-dsm is selected as base-reference",
        "base_iteration_is_required_for_heap",
    )
    BASE_ITERATION_IS_REQUIRED = ApiError(
        "Base iteration is required", "base_iteration_is_required"
    )
    CRS_NOT_FOUND_IN_UPLOADED_VECTOR = ApiError(
        "Uploaded shapefile does not have a CRS. Please set a CRS for the file and re-upload it.",
        "crs_not_found_in_uploaded_vector",
    )
    EITHER_LINE_WKT_OR_FEATURE_REQUIRED = ApiError(
        "Either a line WKT or a feature ID is required",
        "either_line_wkt_or_feature_required",
    )
    EMAIL_REQUIRED = ApiError("Email is required", "email_is_required")
    EMAIL_ALREADY_EXISTS = ApiError(
        "A user with this email already exists", "email_already_exists"
    )
    EXCEEDED_IMAGE_UPLOAD_LIMIT = ApiError(
        "Exceeded image upload limit, maximum 3 images can be uploaded",
        "exceeded_image_upload_limit",
    )
    FEATURE_INFO_NOT_FOUND = ApiError(
        "Feature info not found", "feature_info_not_found"
    )
    FEATURE_MUST_BE_LINESTRING = ApiError(
        "The feature must be a LineString.", "feature_must_be_linestring"
    )
    FEATURE_MUST_BE_POLYGON = ApiError(
        "The feature must be a Polygon.", "feature_must_be_polygon"
    )
    FILE_INFO_ORG_MISMATCH = ApiError(
        "File info and user who is uploading the file should belong to same organisation",
        "file_info_org_mismatch",
    )
    FILE_ID_REQUIRED = ApiError("File id is required", "file_id_required")
    FILE_IS_NOT_UPLOADED = ApiError("File is not uploaded", "file_not_uploaded")
    IMAGE_PAYLOAD_SIZE_EXCEEDED_ALREADY_EXISTING_IMAGES = ApiError(
        "Image payload list size cannot exceed already existing images",
        "image_payload_size_exceeded_already_existing_images",
    )
    INDEX_OUT_OF_RANGE = ApiError("Index is out of range", "index_out_of_range")
    INVALID_ACCESS_TAGS_ORG = ApiError(
        "All access tags should belong to same organisation.",
        "invalid_access_tags_org",
    )
    INVALID_CREDENTIALS = ApiError("Invalid credentials", "invalid_credentials")
    INVALID_VALUE_FIELDS_PARAM = ApiError(
        "Invalid value of fields (include_fields/exclude_fields) parameter",
        "invalid_value_fields_param",
    )
    INVALID_FIELDS_PARAM = ApiError(
        "Include either include_fields or exclude_fields query parameter, not both",
        "invalid_fields_param",
    )
    INVALID_LAYER_ACCESS_TAGS = ApiError(
        "Layer and access tag should belong to same organisation.",
        "invalid_layer_access_tags",
    )
    INVALID_MAJOR_INTERVAL = ApiError(
        "Major interval should be in multiple of minor interval",
        "major_should_be_in_multiple_of_minor",
    )
    INVALID_MONTH = ApiError("Month must be in between 1 and 12.", "invalid_month")
    INVALID_MULTI_POLYGON_WKT = ApiError(
        "Invalid multi-polygon wkt", "invalid_multi_polygon_wkt"
    )
    INVALID_PARAMETER: ApiError = ApiError("Invalid Parameter", "invalid_parameter")
    INVALID_POLYGON_WKT = ApiError("Invalid polygon wkt", "invalid_polygon_wkt")
    INVALID_LINE_WKT = ApiError("Invalid line wkt", "invalid_line_wkt")
    INVALID_RESPONSE_FORMAT = ApiError(
        "Invalid response format", "invalid_response_format"
    )
    INVALID_S3_KEY = ApiError("Invalid S3 key", "invalid_s3_key")
    INVALID_CAPTURED_DSM_FILE = ApiError(
        "Uploaded captured dsm file is not valid", "invalid_captured_dsm_file"
    )
    INVALID_ORTHOMOSAIC_FILE = ApiError(
        "Uploaded orthomosaic file is not valid", "invalid_orhtomosaic_file"
    )
    INVALID_MBTILES_FILE = ApiError(
        "Uploaded mbtiles file is not valid", "invalid_mbtiles_file"
    )
    INVALID_BASE_DSM_FILE = ApiError(
        "Uploaded base dsm file is not valid", "invalid_base_dsm_file"
    )
    INVALID_DSM_FILE = ApiError("File is not a valid DSM", "invalid_dsmg_file")
    INVALID_FILE_TYPE = ApiError("Invalid file type", "invalid_file_type")
    INVALID_LEGEND_IMAGE_FILE = ApiError(
        "Uploaded legend image file is not valid", "invalid_legend_image_file"
    )
    INVALID_KPI_CSV_DATA = ApiError(
        "Uh-oh! We found some issues with the CSV file you uploaded. Please review the data and try again.",
        "invalid_kpi_csv_data",
    )
    INVALID_KPI_CSV = ApiError(
        "Invalid CSV uploaded. Please ensure the format matches the sample template",
        "invalid_kpi_csv_field",
    )
    INVALID_ORTHO_PARAMS = ApiError(
        "ortho_layer_name and orthomosaic both are required for ortho export",
        "invalid_ortho_params",
    )
    INVALID_TOKEN_TYPE = ApiError("Invalid token type", "invalid_token_type")
    ITERATION_NOT_FOUND = ApiError("Iteration not found", "iteration_not_found")
    ITERATIONS_SHOULD_BE_UNIQUE_TOGETHER = ApiError(
        "First iteration and second iteration should not be same",
        "iterations_should_be_unique_together",
    )
    INVALID_KPI_TYPE = ApiError("Invalid KPI type", "invalid_kpi_type")
    LAYER_ID_REQUIRED = ApiError("Layer ID is required.", "layer_id_required")
    LAYER_NOT_FOUND = ApiError("Layer not found", "layer_not_found")
    LOWER_CASE_LETTER_NOT_PRESENT = ApiError(
        "The password must contain at least 1 lowercase letter, a-z.",
        "password_does_not_contain_any_lowercase_letter",
    )

    NO_FILE_TO_EXPORT = ApiError("No file to export", "No_file_to_export")
    OLD_PASSWORD_INCORRECT = ApiError(
        "Incorrect old password", "incorrect_old_password"
    )
    OLD_PASSWORD_REQUIRED = ApiError(
        "Old password is required", "old_password_is_required"
    )
    ONLY_HEX_COLOR_CODES_ALLOWED = ApiError(
        "Invalid hex color code", "invalid_hex_color_code"
    )
    ONLY_VECTOR_LAYER_CAN_BE_DOWNLOADED = ApiError(
        "Only vector layers can be downloaded as shapefile",
        "only_vector_layer_can_be_downloaded",
    )
    PASSWORD_REQUIRED = ApiError("Password is required", "password_is_required")
    PASSWORDS_DO_NOT_MATCH = ApiError("Passwords do not match", "password_do_not_match")
    POINT_OUTSIDE_DATASET_BOUNDS = ApiError(
        slug="point_outside_dataset_bounds",
        message="Point is outside dataset bounds",
    )
    PROJECT_NOT_FOUND = ApiError("Project not found", "project_not_found")
    SAME_ORG_ACCESS_TAGS = ApiError(
        "All access tags should belong to the same organisation.",
        "access_tags_should_from_same_org",
    )
    SAME_ORG_ACCESS_TAGS_AND_USER_GROUP = ApiError(
        "Access Tags and User Group should belong to the same organisation.",
        "access_tags_and_user_group_should_from_same_org",
    )
    SAME_ORG_USERS = ApiError(
        "All users should belong to same organisation.",
        "users_should_from_same_org",
    )
    SAME_ORG_USERS_AND_USER_GROUP = ApiError(
        "User Group and Users should belong to same organisation.",
        "user_group_and_user_should_from_same_org",
    )
    SHAPE_FILE_NOT_FOUND_IN_ZIP = ApiError(
        "The uploaded ZIP file does not contain the shapefile.",
        "shape_file_not_found_in_zip",
    )
    SITE_NOT_FOUND = ApiError("Site not found", "site_not_found")
    SPACE_NOT_ALLOWED = ApiError("Space character is not allowed", "space_not_allowed")
    SPECIAL_CASE_CHAR_NOT_PRESENT = ApiError(
        "The password must contain at least 1 special character: " + "@#$%!^&*",
        "password_does_not_contain_any_special_case_letter",
    )
    UNIQUE_LAYER_FILE_TYPE_ALLOWED = ApiError(
        "Single file of this type can be attached to a layer",
        "unique_layer_file_type_allowed",
    )
    UPPER_CASE_LETTER_NOT_PRESENT = ApiError(
        "The password must contain at least 1 uppercase letter, A-Z.",
        "password_does_not_contain_any_uppercase_letter",
    )
    USER_GROUP_REQUIRED = ApiError("User group is required", "user_group_required")
    INACTIVE_USER = ApiError(
        "User deactivated. Contact admin to reactivate your account.",
        "inactive_user",
    )
    FILE_SIZE_TOO_LARGE = ApiError(
        "The uploaded file exceeds the maximum allowed size.",
        "file_size_exceeds_maximum_allowed_size",
    )
    EMPTY_FILE = ApiError("The uploaded file contains no data", "empty_file_uploaded")
    INVALID_GEOTAG_COLUMNS = ApiError(
        "The number of columns does not match or contains duplicate in geotag file",
        "invalid_geotag_columns",
    )
    INVALID_FIRST_COLUMN_FOR_GEOTAG_FILE = ApiError(
        "The first column should be file name in geotag column schema.",
        "invalid_first_column_name",
    )
    DUPLICATE_COLUMNS_IN_SCHEMA = ApiError(
        "The geotag column schema contains diplicate columns",
        "geotags_file_contains_duplicate_column",
    )

    DUPLICATE_VALUES_IN_FILE = ApiError(
        "The uploaded file contains duplicate values",
        "file_contains_duplicate_values",
    )

    EMPTY_VALUES_IN_FILE = ApiError(
        "The uploaded file contains empty values", "file_contains_empty_values"
    )

    INVALID_GEOTAG_FILE = ApiError(
        "The uploaded file is invalid wrt CRS", "invalid_geotag_file"
    )

    VALUES_OUT_OF_RANGE = ApiError(
        "Coordinates values are out of range", "coordinate_values_out_of_range"
    )

    PARENT_DATASET_ID_REQUIRED = ApiError(
        "Parant dataset id is required.", "parent_dataset_id_required"
    )

    INVALID_FILE_DATA = ApiError(
        "The uploaded file contains invalid data", "invalid_data_in_file"
    )
    # Processing Validation Errors.
    NO_IMAGE_FILENAMES_PROVIDED = ApiError(
        "No image filenames provided in request.",
        "no_image_filenames_provided",
    )
    ITERATION_IMAGE_FOLDER_DOES_NOT_EXISTS = ApiError(
        "Iteration image folder does not exists.",
        "iteration_image_folder_does_not_exists",
    )
    INVALID_FILE_TYPE_PROVIDED = ApiError(
        "Invalid file type provided.",
        "invalid_file_type_provided",
    )
    FILE_UPLOAD_FAILED = ApiError(
        "File upload failed.",
        "file_upload_failed",
    )
    INVALID_GCP_TYPE = ApiError("Invalid GCP type.", "invalid_gcp_type")

    COORDINATES_OUT_OF_BOUNDS = ApiError(
        "Coordinates values are out of bounds.", "coordinates_out_of_bounds"
    )

    INVALID_FILE_FORMAT = ApiError(
        "Invalid file format.",
        "invalid_file_format",
    )
    INVALID_GCP_LABEL = ApiError(
        "Invalid GCP label.",
        "invalid_gcp_label",
    )
    INVALID_GCP_COORDINATES = ApiError(
        "Invalid GCP coordinates.",
        "invalid_gcp_coordinates",
    )
    GCP_NOT_FOUND = ApiError("GCP not found.", "gcp_not_found")
    ONLY_ONE_OF_PARENT_DATASET_ID_REQUIRED = ApiError(
        "Only one of Parant dataset id is required.",
        "only_one_of_parent_dataset_id_required",
    )
    SOME_GEOTAGS_MISSING = ApiError("Some geotags missing.", "some_geotags_missing")
    CONTINUED_FROM_TASK_REQUIRED = ApiError(
        "Continued from task is required.", "continued_from_task_is_required"
    )
    STOP_AFTER_REOPTIMIZE_WITHOUT_REOPTIMIZE_CAMERAS = ApiError(
        "Stop after reoptimize can only be enabled when reoptimize cameras is enabled.",
        "stop_after_reoptimize_can_be_only_enabled_when_reoptimize_cameras_is_enabled",
    )
    END_STAGE_PROVIDED_WITH_STOP_AFTER_REOPTIMIZE = ApiError(
        "End stage cannot be provided when stop after reoptimize is enabled.",
        "end_stage_cannot_be_provided_for_stop_after_optimize",
    )
    END_STAGE_REQUIRED = ApiError("End stage is required.", "end_stage_is_required")
    REOPTIMIZE_CAMERAS_WITHOUT_CONTINUED_FROM_TASK = ApiError(
        "Cannot reoptimize cameras without a continued from task provided.",
        "cannot_reoptimize_cameras_without_continue_from_task_provided",
    )
    CROPPING_REGION_WITHOUT_REOPTIMIZE = ApiError(
        "Cropping region is allowed only when reoptimize is true.",
        "cropping_region_is_allowed_only_when_reoptimize_is_true",
    )
    CROPPING_REGION_BEHAVIOUR_REQUIRED = ApiError(
        "Cropping region behaviour must be defined.",
        "cropping_region_behaviour_must_be_defined",
    )
    CANNOT_REOPTIMIZE_WITH_ALIGN_PHOTOS = ApiError(
        "Cannot reoptimize with end stage as align photos.",
        "cannot_reoptimize_with_end_stage_as_align_photos",
    )
    END_STAGE_SELECTED_NOT_APPLICABLE = ApiError(
        "End stage selected is not applicable.",
        "end_stage_selected_is_not_applicable",
    )
    ONLY_ONE_POLYGON_ALLOWED = ApiError(
        "Only one polygon is allowed.", "ONLY_ONE_POLYGON_ALLOWED"
    )
    INVALID_GEOJSON_UPLOADED = ApiError(
        "Invalid GeoJSON uploaded.", "INVALID_GEOJSON_UPLOADED"
    )
    GEOTAGS_BEING_PROCESSED = ApiError(
        "Geotags are currently being processed.", "GEOTAGS_ARE_BEING_PROCESSED"
    )
    NO_GEOTAGS_FOUND = ApiError(
        "No geotags found for the given iteration.",
        "NO_GEOTAGS_FOUND_FOR_GIVEN_ITERATION",
    )
    COORDINATE_SYSTEM_REQUIRED = ApiError(
        "Coordinate system is required in export-orthomosaic.",
        "COORDINATE_SYSTEM_REQUIRED",
    )
    IMAGES_NOT_PRESENT_IN_S3 = ApiError(
        "Images are not present in s3.",
        "IMAGES_NOT_PRESENT_IN_S3",
    )
    INVALID_IMAGE_TO_TAG = ApiError("Invalid images to tag", "invalid_image_to_tag")
    DUPLICATE_GCP_IMAGE_TAGS = ApiError(
        "Duplicate GCP image tags.", "duplicate_gcp_image_tags"
    )
    SIGNATURE_EXPIRED = ApiError(
        "Iteration dataset download signature expired.",
        "iteration_dataset_download_signature_expired",
    )
    DOWNLOAD_TOKEN_MISSING = ApiError(
        "Download token required.", "download_token_required."
    )

    EITHER_LAYER_OR_SMART_LINE_SHOULD_BE_PROVIDED = ApiError(
        "Either Layer or Smart Line should be provided.",
        "either_layer_or_smart_line_should_be_provided",
    )
    EITHER_LAYER_OR_SMART_AREA_SHOULD_BE_PROVIDED = ApiError(
        "Either Layer or Smart Area should be provided.",
        "either_layer_or_smart_area_should_be_provided",
    )
    GCP_ID_NOT_PROVIDED = ApiError("GCP id not provided.", "gcp_id_not_provided.")

    TASK_CANCELLATION_NOT_ALLOWED = ApiError(
        "Task cancellation is only allowed by user.", "task_cancellation_not_allowed."
    )
    NAME_NOT_PROVIDED = ApiError("Name not provided.", "name_not_provided")
    INVALID_API_KEY = ApiError("Invalid API key.", "invalid_api_key")
    GEOTAG_ERRORS_NOT_FOUND = ApiError(
        "Geotag errors not found.", "geotag_errors_not_found"
    )
    AVERAGE_ERRORS_NOT_FOUND = ApiError(
        "Average errors not found.", "average_errors_not_found"
    )
    GEOTAG_ERROR_MALFORMED_REQUEST = ApiError(
        "Geotag error malformed request.", "geotag_error_malformed_request"
    )
    INVALID_SMART_DETECT_OUTPUT_TYPE = ApiError(
        "Invalid smart detect output type.", "invalid_smart_detect_output_type"
    )
