from unittest import mock

from botocore.exceptions import ClientError
from fastapi import status

from ..shared.aws import AwsManager
from .base_test import BaseTestCase
from .mocks import MockedAwsManager


class TestMBilesTileEndpoint(BaseTestCase):
    def test_mbtiles_case_1(self):
        """
        Test mbtiles endpoint with valid key and user access token.
        """

        # Arrange.
        params = {
            "key": "test_s3_key",
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/mbtiles/13/6080/3537.png", params=params)

        # Assert.
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["Content-Type"] == "image/png"
        assert response.text is not None

    def test_mbtiles_case_2(self):
        """
        Test mbtiles endpoint with valid key and org access token.
        """

        # Arrange.
        params = {
            "key": "test_s3_key",
        }
        self.authenticate_with_org_token()

        # Act.
        response = self.client.get("/mbtiles/13/6080/3537.png", params=params)

        # Assert.
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["Content-Type"] == "image/png"
        assert response.text is not None

    def test_mbtiles_case_3(self):
        """
        Test mbtiles endpoint with valid key but without authentication.
        """

        # Arrange.
        params = {
            "key": "test_s3_key",
        }
        self.unauthenticate()

        # Act.
        response = self.client.get("/mbtiles/13/6080/3537.png", params=params)

        # Assert.
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @mock.patch.object(
        AwsManager,
        "get_file",
        return_value=MockedAwsManager.get_file(),
    )
    def test_mbtiles_case_4(self, mock_object):
        """
        Test mbtiles endpoint with invalid key.
        """

        # Mock.
        mock_object.side_effect = ClientError(
            {"Error": {"Code": "400", "Message": "File Not Found"}}, "GetObject"
        )

        # Arrange.
        params = {
            "key": "test_s3_key",
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/mbtiles/16/47792/28595.png", params=params)
        response_meta = response.json()["meta"]

        # Assert.
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response_meta["slug"] == "tile_not_found"

    def test_mbtiles_case_5(self):
        """
        Test mbtiles endpoint with invalid tiles coordinates.
        """

        # Arrange.
        params = {
            "key": "test_s3_key",
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/mbtiles/1/47792/28595.png", params=params)
        response_meta = response.json()["meta"]

        # Assert.
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response_meta["slug"] == "invalid_tile_coordinates"
