from unittest import mock
from uuid import uuid4

import pytest
from botocore.exceptions import ClientError
from fastapi import status
from pytest_mock.plugin import MockerFixture

from ..db import PostgresManager
from ..shared.aws import AwsManager
from .base_test import BaseTestCase
from .mocks import MockedAwsManager


@pytest.fixture
def mocked_postgres_manager(mocker: MockerFixture):
    mocked_generate_vector_tile = mocker.patch.object(
        PostgresManager,
        "generate_vector_tile",
        return_value=b"Mocked Vector Tile",
    )

    return mocked_generate_vector_tile


class TestVectorTileEndpoint(BaseTestCase):
    # Tests vector tiles from S3.
    def test_vector_tile_case_1(self):
        """
        Test vector tile endpoint with valid z, x, y and user access token.
        """

        # Arrange.
        params = {
            "key": "test_s3_key",
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/vector/13/6080/3537.pbf", params=params)

        # Assert.
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["Content-Type"] == "application/vnd.mapbox-vector-tile"
        assert response.text is not None

    def test_vector_tile_case_2(self):
        """
        Test vector tile endpoint with valid z, x, y and org access token.
        """

        # Arrange.
        params = {
            "key": "test_s3_key",
        }
        self.authenticate_with_org_token()

        # Act.
        response = self.client.get("/vector/13/6080/3537.pbf", params=params)

        # Assert.
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["Content-Type"] == "application/vnd.mapbox-vector-tile"
        assert response.text is not None

    def test_vector_tile_case_3(self):
        """
        Test vector tile endpoint with valid z, x, y but without authentication.
        """

        # Arrange.
        params = {
            "key": "test_s3_key",
        }
        self.unauthenticate()

        # Act.
        response = self.client.get("/vector/13/6080/3537.pbf", params=params)

        # Assert.
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @mock.patch.object(
        AwsManager,
        "get_file",
        return_value=MockedAwsManager.get_file(),
    )
    def test_vector_tile_case_4(self, mock_object):
        """
        Test vector tile endpoint with z, x, y for which tile is not present.
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
        response = self.client.get("/vector/16/47792/28595.pbf", params=params)
        response_meta = response.json()["meta"]

        # Assert.
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response_meta["slug"] == "tile_not_found"

    def test_vector_tile_case_5(self):
        """
        Test vector tile endpoint with invalid tile coordinates (Z,X,Y).
        """

        # Arrange.
        params = {
            "key": "test_s3_key",
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/vector/1/47792/28595.pbf", params=params)
        response_meta = response.json()["meta"]

        # Assert.
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response_meta["slug"] == "invalid_tile_coordinates"

    def test_vector_tile_case_6(self, mocked_postgres_manager):
        """
        Test vector tile endpoint with valid tile coordinates and layer id.
        """

        # Arrange.
        params = {
            "layer_id": uuid4(),
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/vector/16/47792/28595.pbf", params=params)

        # Assert.
        assert response.status_code == status.HTTP_200_OK
        assert response.text == "Mocked Vector Tile"
        assert response.headers["Content-Type"] == "application/vnd.mapbox-vector-tile"
        PostgresManager.generate_vector_tile.assert_called_once()
