from unittest import TestCase

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from django.http import HttpRequest
from django.urls import reverse
from rest_framework.exceptions import (
    APIException,
    MethodNotAllowed,
    NotAuthenticated,
    PermissionDenied,
    ValidationError,
)
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from rainbow.exceptions.handler import custom_exception_handler
from shared.exception_handling import DSMNotFoundException
from shared.exception_handling.api_errors import ApiErrors, ValidationErrors


class TestExceptionHandling(TestCase):
    def test_handle_self_generated_exception(self):
        exception_obj = DSMNotFoundException(ApiErrors.DSM_NOT_FOUND.value)
        response = custom_exception_handler(exception_obj, None)
        expected_data = {
            "message": "DSM not found for the iteration",
            "slug": "dsm_not_found_for_the_iteration",
            "type": "DSMNotFoundException",
        }
        self.assertEqual(expected_data, response.data)

    def test_handle_generic_error_by_django(self):
        exception_obj = APIException("Test Django internal exception")
        response = custom_exception_handler(exception_obj, None)
        expected_data = {
            "message": "Test Django internal exception",
            "slug": "test_django_internal_exception",
            "type": "APIException",
        }
        self.assertEqual(expected_data, response.data)

    def test_handle_generic_python_error(self):
        exception_obj = TypeError("Test type error")
        response = custom_exception_handler(exception_obj, None)
        expected_data = {
            "message": "Internal Server Error",
            "slug": "internal_server_error",
            "type": "TypeError",
        }
        self.assertEqual(expected_data, response.data)

    def test_handle_invalid_token(self):
        exception_obj = InvalidToken()
        req = HttpRequest()
        req.path = reverse("token-refresh")
        context = {"request": req}

        response = custom_exception_handler(exception_obj, context)
        expected_data = {
            "message": "Token is expired.",
            "slug": "token_expired",
            "type": "TokenBlacklisted",
        }
        self.assertEqual(expected_data, response.data)

    def test_handle_token_error(self):
        exception_obj = TokenError()
        req = HttpRequest()
        req.path = reverse("auth-login")
        context = {"request": req}

        response = custom_exception_handler(exception_obj, context)
        expected_data = {
            "message": "Token error occurred.",
            "slug": "token_error",
            "type": "TokenError",
        }
        self.assertEqual(expected_data, response.data)

    def test_handle_permission_error(self):
        exception_obj = PermissionDenied()
        response = custom_exception_handler(exception_obj, None)
        expected_data = {
            "message": "You are not authorized to perform this action",
            "slug": "permission_denied",
            "type": "PermissionDenied",
        }
        self.assertEqual(expected_data, response.data)

    def test_handle_integrity_error(self):
        exception_obj = IntegrityError()
        response = custom_exception_handler(exception_obj, None)
        expected_data = {
            "message": "Validation Error Occurred",
            "slug": "form_validation_error",
            "details": {
                "form": {
                    "message": "Object already exists",
                    "slug": "object_already_exists",
                }
            },
            "type": "IntegrityError",
        }
        self.assertEqual(expected_data, response.data)

    def test_handle_unauthenticated_error(self):
        exception_obj = NotAuthenticated()
        response = custom_exception_handler(exception_obj, None)
        expected_data = {
            "message": "Please log in to proceed",
            "slug": "authentication_error",
            "type": "NotAuthenticated",
        }
        self.assertEqual(expected_data, response.data)

    def test_handle_method_not_allowed_error(self):
        exception_obj = MethodNotAllowed("GET")
        response = custom_exception_handler(exception_obj, None)
        expected_data = {
            "message": "This method is not allowed",
            "slug": "method_not_allowed",
            "type": "MethodNotAllowed",
        }
        self.assertEqual(expected_data, response.data)

    def test_handle_django_validation_error(self):
        exception_obj = DjangoValidationError("Test Django Validation Error raised")
        response = custom_exception_handler(exception_obj, None)
        expected_data = {
            "message": "Test Django Validation Error raised",
            "slug": "test_django_validation_error_raised",
            "type": "ValidationError",
        }
        self.assertEqual(expected_data, response.data)

    def test_handle_custom_validation_errors(self):
        exception_obj = ValidationError(ValidationErrors.INVALID_PARAMETER.value)
        response = custom_exception_handler(exception_obj, None)
        expected_data = {
            "message": "Invalid Parameter",
            "slug": "invalid_parameter",
            "type": "ValidationError",
        }
        self.assertEqual(expected_data, response.data)

    def test_handle_model_validation_error(self):
        exception_obj = ValidationError(
            {
                "name": [ValidationErrors.SPACE_NOT_ALLOWED.value],
                "color": [ValidationErrors.ONLY_HEX_COLOR_CODES_ALLOWED.value],
            }
        )
        response = custom_exception_handler(exception_obj, None)
        expected_data = {
            "message": "Validation Error Occurred",
            "slug": "form_validation_error",
            "type": "ValidationError",
            "details": {
                "name": [
                    {
                        "message": "Space character is not allowed",
                        "slug": "space_not_allowed",
                    },
                ],
                "color": [
                    {
                        "message": "Invalid hex color code",
                        "slug": "invalid_hex_color_code",
                    }
                ],
            },
        }
        self.assertEqual(expected_data, response.data)

    def test_handle_validation_error_by_model_validators(self):
        exception_obj = ValidationError(
            {"non_field_errors": ["The value input value is not correct"]}
        )
        response = custom_exception_handler(exception_obj, None)
        expected_data = {
            "message": "Validation Error Occurred",
            "slug": "form_validation_error",
            "type": "ValidationError",
            "details": {
                "form": {
                    "message": "The value input value is not correct",
                    "slug": "the_value_input_value_is_not_correct",
                },
            },
        }
        self.assertEqual(expected_data, response.data)
