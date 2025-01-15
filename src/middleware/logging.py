import time

from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware

from ..shared import logger
from ..shared.constants import EnvVariable


class LoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app) -> None:
        super().__init__(app)

    # Ref: https://stackoverflow.com/a/71526036
    async def dispatch(self, request: Request, call_next) -> Response:
        request_method = request.get("method")
        request_path = request.get("path")

        # Get response body.
        start_time = time.time()

        response = await call_next(request)

        execution_time = (time.time() - start_time) * 1000
        formatted_execution_time = "{0:.2f}".format(execution_time)

        # Disable logging for certain conditions
        log_disabling_conditions = [
            EnvVariable.ENVIRONMENT.value == "local",
            request_path in ["/ping"],
            response.status_code == status.HTTP_404_NOT_FOUND,
            request_method == "OPTIONS",
        ]

        if not any(log_disabling_conditions):
            log = {
                "request_route": f"{request_method} {request_path}",
                "execution_time": f"{formatted_execution_time} ms",
                "request_params": request.get("query_string"),
                "response_status_code": response.status_code,
            }

            logger.info(log)

        return response
