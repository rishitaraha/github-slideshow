from collections import defaultdict
from typing import Union

from fastapi import FastAPI, Request, status
from fastapi.exceptions import HTTPException, RequestValidationError
from slugify import slugify
from starlette.exceptions import HTTPException as StarletteHTTPException

from ..config.custom_response import CustomResponse
from ..shared import logger
from .api_errors import ApiErrors
from .custom_exceptions import GeneralException
from .helpers import slugify_form_field

# TODO: Optimize the handler for all type of exceptions.


async def http_exception_handler(
    request: Request,
    exc: Union[HTTPException, StarletteHTTPException, GeneralException],
):
    http_exception_content = {
        "success": False,
        "status_code": exc.status_code,
        "message": "",
        "details": {},
        "type": exc.__class__.__name__,
    }

    # Case 1: Custom GeneralException exception raised.
    if isinstance(exc, GeneralException):
        logger.info(exc.detail)
        http_exception_content["slug"] = exc.detail.slug
        http_exception_content["message"] = exc.detail.message

    # Case 2: Internal Server Error.
    elif exc.status_code >= 500:
        logger.exception(exc.detail)
        http_exception_content["slug"] = slugify(exc.detail, separator="_")
        http_exception_content["message"] = exc.detail

    return CustomResponse(
        status_code=exc.status_code,
        content=http_exception_content,
    )


"""
Validation Error Response Format:
	validation_error_response = {
		meta: {
				type: str,
				success: str,
				slug: str
				message: str
				details: {
						"form_field_name": {
								"message": "form_field_validation_message",
								"slug": "slug"
						}
				}
		}
		data: {}
	}
"""


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Create a default dictionary to store details of form errors
    details = defaultdict(list)

    validation_error_content = {
        "type": exc.__class__.__name__,
        "success": False,
        "slug": ApiErrors.FORM_VALIDATION_ERROR.value.slug,
        "message": ApiErrors.FORM_VALIDATION_ERROR.value.message,
    }

    validation_errors = exc.errors()

    # Sample: validation_errors = [ {'loc': ('body', 'form_field_name'), 'msg': 'Form field Error message', 'type': 'value_error.missing'}]
    for error in validation_errors:
        form_field_name = error.get("loc")[1]
        details[form_field_name] = {
            "slug": slugify_form_field(form_field_name),
            "message": error.get("msg"),
        }

    validation_error_content["details"] = details

    return CustomResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=validation_error_content,
    )


def setup_exception_handlers(app: FastAPI):
    # Adding validation error handler.
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

    # HTTP Exception handler.
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(GeneralException, http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
