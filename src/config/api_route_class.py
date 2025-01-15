from typing import Callable

from fastapi import HTTPException, Request, Response
from fastapi.routing import APIRoute

from ..exceptions import GeneralException


class CustomAPIRoute(APIRoute):
    """
    Custom APIRoute that handles application errors and exceptions.
    """

    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request) -> Response:
            try:
                return await original_route_handler(request)
            except Exception as exception:
                if isinstance(exception, (HTTPException, GeneralException)):
                    raise exception

                # raise Internal server error as HTTPException.
                raise HTTPException(status_code=500, detail=str(exception))

        return custom_route_handler
