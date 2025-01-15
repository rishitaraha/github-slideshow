import secrets
from unittest import mock

from fastapi.testclient import TestClient

from ..main import app
from ..shared.api_client import AioHttpClient
from ..shared.aws import AwsManager
from .helpers import generate_jwt_token
from .mocks import MockedAioHttpClient, MockedAwsManager


class BaseTestCase:
    client = TestClient(app)
    user_access_token = generate_jwt_token()
    org_access_token = secrets.token_hex(25)

    def authenticate_with_user_token(self):
        # Remove any existing org access token headers from the client.
        self.client.headers.pop("x-org-access-token", None)

        # Adding Authorization header.
        headers = {"Authorization": f"Bearer {self.user_access_token}"}
        self.client.headers.update(headers)

    def authenticate_with_org_token(self):
        # Remove any existing authentication headers from the client.
        self.client.headers.pop("Authorization", None)

        # Adding org access token header.
        headers = {"x-org-access-token": self.org_access_token}
        self.client.headers.update(headers)

    def unauthenticate(self):
        # Remove any existing authentication headers from the client.
        self.client.headers.pop("Authorization", None)

        # Remove any existing org access token headers from the client.
        self.client.headers.pop("x-org-access-token", None)

    """
    Mocks.
    """
    # Mock AioHttpClient.
    mock.patch.object(
        AioHttpClient, "post", return_value=MockedAioHttpClient.post()
    ).start()

    # Mock AwsManager.
    mock.patch.object(
        AwsManager,
        "get_file",
        return_value=MockedAwsManager.get_file(),
    ).start()
