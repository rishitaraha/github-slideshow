from typing import Tuple
from uuid import UUID

from rest_framework import status
from rest_framework.exceptions import APIException

from rainbow import logger

from .session import processing_api


def connect(id: UUID, request_body: dict) -> Tuple[dict, int]:
    response = processing_api.post(
        f"/organization/{str(id)}/connect",
        request_body,
    )
    if response.status_code != status.HTTP_200_OK:
        logger.error(response.text)
        raise APIException(
            "Unable to connect to processing application",
            code=response.status_code,
        )

    response_data = dict(response.json()).get("data")

    logger.info("Response from processing connect: " + str(response_data))

    return response_data, response.status_code


def create_org(request_body: dict) -> Tuple[dict, int]:
    response = processing_api.post(
        f"/organization/add",
        request_body,
    )

    if response.status_code != status.HTTP_200_OK:
        logger.error(response.text)
        raise APIException(
            "Unable to connect to processing application",
            code=response.status_code,
        )

    create_org_response_data = dict(response.json()).get("data")

    logger.info("Response from processing create org: " + str(create_org_response_data))
    return create_org_response_data, response.status_code


def generate_token(id: UUID) -> Tuple[dict, int]:
    response = processing_api.get(
        f"/organization/{id}/generate_token",
    )

    if response.status_code != status.HTTP_200_OK:
        logger.error(response.text)
        raise APIException(
            "Unable to connect to processing application",
            code=response.status_code,
        )

    token_response_data = dict(response.json()).get("data")

    logger.info("Response from processing generate token: " + str(response))

    return token_response_data, response.status_code


def disconnect(id: UUID) -> Tuple[dict, int]:
    response = processing_api.delete(
        f"/organization/{id}/disconnect",
    )

    if response.status_code != status.HTTP_200_OK:
        logger.error(response.text)
        raise APIException(
            "Unable to connect to processing application",
            code=response.status_code,
        )

    logger.info("Response from processing disconnect api: " + str(response))

    response_data = dict(response.json()).get("data")
    return response_data, response.status_code
