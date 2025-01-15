from enum import Enum

from ..helpers import ApiError


class ApiErrors(Enum):
    AUTHENTICATION_ERROR = ApiError("Please log in to proceed", "authentication_error")
    AUTHENTICATION_FAILED = ApiError("Authentication Failed", "authentication_failed")
    CAPTURE_DSM_UPLOAD_FAILED = ApiError(
        "Capture DSM upload failed", "capture_dsm_upload_failed"
    )
    CORS_ERROR = ApiError("Host is not allowed", "cors_error")
    DSM_NOT_FOUND = ApiError(
        "DSM not found for the iteration",
        "dsm_not_found_for_the_iteration",
    )
    DSM_COG_NOT_FOUND = ApiError(
        "DSM cog not found for the iteration",
        "dsm_cog_not_found_for_the_iteration",
    )
    FORM_VALIDATION_ERROR = ApiError(
        "Validation Error Occurred", "form_validation_error"
    )
    FILE_NOT_FOUND = ApiError("File not found", "file_not_found")
    IMAGE_UPLOAD_FAILED = ApiError("Image upload failed", "image_upload_failed")
    INTERNAL_SERVER_ERROR = ApiError("Internal Server Error", "internal_server_error")
    INVALID_RESPONSE = ApiError("Invalid Response", "invalid_response")
    INVALID_ORG_ACCESS_TOKEN = ApiError(
        "Invalid org access token", "invalid_org_access_token"
    )
    INVALID_ITERATION_IDS = ApiError(
        "Invalid iteration IDs. No iteration found for the given iteration IDs",
        "invalid_iteration_ids",
    )
    INVALID_LINK = ApiError(
        "The link you are accessing is either invalid or does not exist. Please check the link and try again.",
        "invalid_link",
    )
    ITERATION_ID_NOT_FOUND = ApiError(
        "Please add iteration ID to the query parameter",
        "iteration_id_not_found",
    )
    METHOD_NOT_ALLOWED = ApiError("This method is not allowed", "method_not_allowed")
    NO_FEATURE_PRESENT_FOR_THE_LAYER = ApiError(
        "No feature present for the layer", "no_feature_present_for_the_layer"
    )
    NO_FEATURE_PRESENT_FOR_CLAMPING = ApiError(
        "No feature present for clamping in the layer",
        "no_feature_present_for_clamping",
    )
    NOT_FOUND = ApiError("Not Found", "not_found")
    NOTHING_TO_DISCONNECT = ApiError(
        "No connection established to disconnect from",
        "no_processing_connection",
    )
    OBJECT_ALREADY_EXISTS = ApiError("Object already exists", "object_already_exists")
    OBJECT_NOT_FOUND = ApiError(
        "The object does not exist.",
        "object_not_found",
    )
    ORG_ACCESS_TOKEN_IS_DEACTIVATED = ApiError(
        "Org access token is deactivated", "org_access_token_deactivated"
    )
    PERMISSION_DENIED = ApiError(
        "You are not authorized to perform this action", "permission_denied"
    )
    PROCESSING_CONNECTION_FAILED = ApiError(
        "Failed to connect to Processing Module. Please check your connection token and organisation ID",
        "processing_module_error",
    )
    DOWNLOAD_FAILED = ApiError("Download failed, please try again.", "download_failed")
    PROCESSING_DISCONNECTION_FAILED = ApiError(
        "Failed to disconnect to Processing Module",
        "processing_module_disconnect_error",
    )
    TOKEN_ERROR = ApiError("Token error occurred.", "token_error")
    TOKEN_EXPIRED = ApiError("Token is expired.", "token_expired")

    # Processing API Errors.
    IMAGE_FILE_DOES_NOT_EXISTS_IN_S3 = ApiError(
        "Image file does not exists in S3", "image_file_does_not_exists_in_S3"
    )

    INVALID_SIGNED_TOKEN = ApiError("Invalid signed token", "invalid_signed_token")
    INVALID_STATUS_TRANSITION = ApiError(
        "Invalid status transition", "invalid_status_transition"
    )
