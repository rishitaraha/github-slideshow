from unittest import mock

from botocore.exceptions import ClientError
from fastapi import status

from src.assets import AssetPath

from ..shared.aws import AwsManager
from .base_test import BaseTestCase
from .mocks import MockedAwsManager


class TestTerrainTileEndpoint(BaseTestCase):
    def test_terrain_tile_case_1(self):
        """
        Test terrain tile endpoint with valid z, x, y and user access token.
        """

        # Arrange.
        params = {
            "key": "test_s3_key",
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/terrain/13/6080/3537.terrain", params=params)

        # Assert.
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["Content-Type"] == "application/octet-stream"
        assert response.text is not None

    def test_terrain_tile_case_2(self):
        """
        Test terrain tile endpoint with valid z, x, y and org access token.
        """

        # Arrange.
        params = {
            "key": "test_s3_key",
        }
        self.authenticate_with_org_token()

        # Act.
        response = self.client.get("/terrain/13/6080/3537.terrain", params=params)

        # Assert.
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["Content-Type"] == "application/octet-stream"
        assert response.text is not None

    def test_terrain_tile_case_3(self):
        """
        Test terrain tile endpoint with valid z, x, y but without authentication.
        """

        # Arrange.
        params = {
            "key": "test_s3_key",
        }
        self.unauthenticate()

        # Act.
        response = self.client.get("/terrain/13/6080/3537.terrain", params=params)

        # Assert.
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @mock.patch.object(
        AwsManager,
        "get_file",
        return_value=MockedAwsManager.get_file(),
    )
    def test_terrain_tile_case_4(self, mock_object):
        """
        Test terrain tile endpoint with z, x, y for which tile is not present.
        """

        # Mock.
        mock_object.side_effect = ClientError(
            {"Error": {"Code": "400", "Message": "File Not Found"}}, "GetObject"
        )

        # Arrange.
        params = {
            "key": "test_s3_key",
        }
        with open(AssetPath.EMPTY_CESIUM_TERRAIN.value, "rb") as file:
            EMPTY_TILE = file.read()

        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/terrain/16/47792/28595.terrain", params=params)

        # Assert.
        assert response.status_code == status.HTTP_200_OK
        assert response.content == EMPTY_TILE
        assert response.headers["Content-Type"] == "application/octet-stream"
