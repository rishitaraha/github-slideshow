from io import BufferedReader
from typing import TypedDict


class PrepareVectorFileResponseSchema(TypedDict):
    file: BufferedReader
    filename: str
    content_type: str


class VectorDataSchema(TypedDict):
    geometry: str
    attributes: dict
