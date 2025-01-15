from unittest import mock
from uuid import uuid4

from botocore.exceptions import ClientError
from fastapi import status

from ..shared.aws import AwsManager
from .base_test import BaseTestCase
from .mocks import MockedAwsManager


class TestTerrainMetadataEndpoint(BaseTestCase):
    @mock.patch.object(
        AwsManager,
        "get_file",
        return_value=MockedAwsManager.get_file("terrain_metadata"),
    )
    def test_terrain_metadata_case_1(self, mock_object):
        """
        Test terrain metadata endpoint with valid s3 key and user access token.
        """

        # Arrange.
        params = {
            "key": "test_s3_key",
            "iteration_id": uuid4(),
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/terrain/layer.json", params=params)

        # Assert.
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["Content-Type"] == "application/json"
        assert response.text is not None

    @mock.patch.object(
        AwsManager,
        "get_file",
        return_value=MockedAwsManager.get_file("terrain_metadata"),
    )
    def test_terrain_metadata_case_2(self, mock_object):
        """
        Test terrain metadata endpoint with valid s3 key and org access token.
        """

        # Arrange.
        params = {
            "key": "test_s3_key",
            "iteration_id": uuid4(),
        }
        self.authenticate_with_org_token()

        # Act.
        response = self.client.get("/terrain/layer.json", params=params)

        # Assert.
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["Content-Type"] == "application/json"
        assert response.text is not None

    def test_terrain_metadata_case_3(self):
        """
        Test terrain metadata endpoint with valid s3 kye but without authentication.
        """

        # Arrange.
        params = {
            "key": "test_s3_key",
            "iteration_id": uuid4(),
        }
        self.unauthenticate()

        # Act.
        response = self.client.get("/terrain/layer.json", params=params)

        # Assert.
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @mock.patch.object(
        AwsManager,
        "get_file",
        return_value=MockedAwsManager.get_file("terrain_metadata"),
    )
    def test_terrain_metadata_case_4(self, mock_object):
        """
        Test terrain metadata endpoint with invalid s3 key.
        """

        # Mock.
        mock_object.side_effect = ClientError(
            {"Error": {"Code": "400", "Message": "File Not Found"}}, "GetObject"
        )

        # Arrange.
        params = {
            "key": "invalid_s3_key",
            "iteration_id": uuid4(),
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/terrain/layer.json", params=params)
        response_meta = response.json()["meta"]

        # Assert.
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response_meta["slug"] == "metadata_not_found"
