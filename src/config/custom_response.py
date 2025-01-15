from typing import Any

from fastapi.responses import JSONResponse
from starlette.background import BackgroundTask


class CustomResponse(JSONResponse):
    """
    Custom response renderer.
    """

    def __init__(
        self,
        content: Any = None,
        status_code: int = 200,
        headers: dict = None,
        media_type: str = None,
        background: BackgroundTask = None,
    ) -> None:
        message = ""
        data = {}
        details = []
        type = ""
        slug = ""

        if isinstance(content, dict):
            message = content.pop("message", message)
            data = content.pop("data", data)
            details = content.pop("details", details)
            slug = content.pop("slug", slug)
            type = content.pop("type", type)
            status_code = content.pop("status_code", status_code)

        response = {
            "meta": {
                "message": message,
                "status_code": status_code,
                "success": True if status_code < 400 else False,
                "type": type,
                "details": details,
                "slug": slug,
            },
            "data": data,
        }

        super().__init__(
            content=response,
            status_code=status_code,
            headers=headers,
            media_type=media_type,
            background=background,
        )
