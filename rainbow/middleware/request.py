from django.http import HttpRequest

from shared.connection import analytics_engine_api


class RequestInterceptor:
    def __init__(self, get_response):
        # One-time configuration and initialization.
        self.get_response = get_response

    def __call__(self, request: HttpRequest):
        # Forwarding request id to microservices.
        analytics_engine_api.headers["X-Request-ID"] = request.headers.get(
            "X-Request-ID"
        )

        return self.get_response(request)
