from typing import Callable

from fastapi import Request, Security

from .authenticator import verify_token

AuthenticateWithApiEngine = Security(verify_token)


async def verify_token_with_api_engine_and_master_server(request: Request):
    """
    Verifies the token with Api Engine first and then with Master server.
    """

    return await verify_token(request, with_master_server=True)


# Authenticate will authenticate user with api engine as well as master server.
Authenticate = Security(
    verify_token_with_api_engine_and_master_server,
)
