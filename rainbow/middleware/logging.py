import json
import time

from django.http import HttpRequest, HttpResponse
from django.urls import reverse
from rest_framework import status

from rainbow.env_variables import EnvVariable
from rainbow.log_config import init_logger

from ..exceptions.helpers import is_json_string


class LoggingMiddleware:
    FIELDS_TO_MASK = [
        "password",
        "confirm_new_password",
        "new_password",
        "old_password",
    ]

    def __init__(self, get_response):
        # One-time configuration and initialization.
        self.get_response = get_response

        self.logger = init_logger("REQUEST_RESPONSE_LOGGER")

    def __call__(self, request: HttpRequest):
        request_body = request.body

        if request.content_type == "application/json" and is_json_string(request_body):
            request_body = json.loads(request_body.decode("utf-8"))

        elif request.content_type == "multipart/form-data":
            request_body = request.POST.dict()

        if isinstance(request_body, dict):
            for key in request_body:
                if key in self.FIELDS_TO_MASK:
                    request_body[key] = "*****"

        request_params = request.META.get("QUERY_STRING", None)

        execution_time = time.time()
        response: HttpResponse = self.get_response(request)
        execution_time = int((time.time() - execution_time) * 1000)

        response_body = response.content if hasattr(response, "content") else None
        user_email = request.user.email if request.user.is_authenticated else None

        # Disable logging for certain conditions
        log_disabling_conditions = [
            EnvVariable.ENVIRONMENT.value == "local",
            request.path in [reverse("ping")],
            response.status_code == status.HTTP_404_NOT_FOUND,
            request.method == "OPTIONS",
        ]

        if not any(log_disabling_conditions):
            log = {
                "request_route": f"{request.method} {request.get_full_path()}",
                "request_id": request.headers.get("X-REQUEST-ID"),
                "execution_time": f"{execution_time} ms",
                "request_params": request_params,
                "request_body": request_body,
                "response_status_code": response.status_code,
                "response_body": response_body,
                "user_email": user_email,
            }
            self.logger.info(log)

        return response
