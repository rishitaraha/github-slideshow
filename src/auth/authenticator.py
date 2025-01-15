from fastapi import HTTPException, Request, status

from .helpers import validate_org_access_token, validate_user_access_token
from .redis_models import AccessTokenCache


async def verify_token(request: Request, with_master_server=False):
    if user_access_token := request.headers.get("Authorization"):
        token = user_access_token.split()[1]
        if AccessTokenCache.exists(token):
            return True

        return await validate_user_access_token(token, with_master_server)

    elif org_access_token := request.headers.get("x-org-access-token"):
        if AccessTokenCache.exists(org_access_token):
            return True

        return await validate_org_access_token(org_access_token)

    else:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
