from fastapi import HTTPException, Request, status

from .. import logger
from ..api_client import AioHttpClient
from ..constants import EnvVariable


async def validate_data_access_permission(
    request: Request, s3_key: str, iteration_id: str
):
    """
    Validates if the user has permission to view the data by sending request to api engine.
    """

    if request.headers.get("x-org-access-token") and not request.headers.get(
        "Authorization"
    ):
        return True

    payload = {
        "s3_key": s3_key,
        "iteration": iteration_id,
    }

    response = await AioHttpClient.post(
        f"{EnvVariable.API_ENGINE_URL.value}/iterations/check-terrain-tiles-permission/",
        data=payload,
        headers={"Authorization": request.headers.get("Authorization")},
    )

    if response.status == status.HTTP_200_OK:
        return True

    elif response.status >= status.HTTP_500_INTERNAL_SERVER_ERROR:
        logger.error(response.text)
    else:
        logger.debug(response.text)

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
