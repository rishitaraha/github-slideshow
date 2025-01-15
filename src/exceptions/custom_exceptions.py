import http
from typing import Any, Optional

from fastapi import HTTPException, status


class GeneralException(HTTPException):
    def __init__(
        self,
        detail: Any = None,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        headers: Optional[dict] = None,
    ) -> None:
        if detail is None:
            detail = http.HTTPStatus(status_code).phrase
        self.status_code = status_code
        self.detail = detail
        self.headers = headers

    def __repr__(self) -> str:
        class_name = self.__class__.__name__
        return f"{class_name}(status_code={self.status_code!r}, detail={self.detail!r})"
