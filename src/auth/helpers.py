from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from ..shared.api_client import AioHttpClient
from ..shared.constants import EnvVariable
from .constants import TokenType
from .redis_models import AccessTokenCache


async def validate_org_access_token(token: str):
    """
    Verifies org access token with Analytics API Engine.
    """

    payload = {
        "token": token,
        "type": TokenType.ORG_ACCESS_TOKEN.value,
    }
    response = await AioHttpClient.post(
        f"{EnvVariable.API_ENGINE_URL.value}/auth/token/verify/", payload
    )

    if response.status == status.HTTP_200_OK:
        access_token = AccessTokenCache(
            token=token,
            expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        )
        access_token.save()

        # Caching org token for 24 hr.
        access_token.expire(24 * 60 * 60)

        return True

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


async def validate_user_access_token(token: str, with_master_server=False):
    """
    Verifies user access token with Analytics API Engine or Pipeline Master Server.
    """

    time_now = datetime.now(tz=timezone.utc)

    is_token_valid: bool = False

    # Validating token with Analytics API Engine.
    payload = {
        "token": token,
        "type": TokenType.USER_ACCESS_TOKEN.value,
    }

    response = await AioHttpClient.post(
        f"{EnvVariable.API_ENGINE_URL.value}/auth/token/verify/", payload
    )

    if response.status == status.HTTP_200_OK:
        is_token_valid = True

    elif with_master_server:
        # Validate if the request is from Master Server instead.
        response = await AioHttpClient.post(
            f"{EnvVariable.MASTER_SERVER_VERIFY_TOKEN_URL.value}",
            {"token": token},
        )
        is_token_valid = response.status == status.HTTP_200_OK

    if is_token_valid:
        access_token = AccessTokenCache(
            token=token,
            # HACK: Get the expires_at time from api engine.
            expires_at=time_now + timedelta(hours=1),
        )
        access_token.save()

        # TTL -> Time To Live.
        # HACK: Get the expires_at time from api engine.
        access_token.expire(60 * 60)  # 1 HR
        return True

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
