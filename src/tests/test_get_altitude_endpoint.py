from unittest import mock

from fastapi import status
from pytest import fixture
from rasterio import RasterioIOError
from rio_tiler.errors import PointOutsideBounds

from .base_test import BaseTestCase
from .mocks import MockCOGReader


@fixture
def mocked_cog_reader():
    with mock.patch(
        "src.routers.fetch_altitude.COGReader", MockCOGReader()
    ) as mock_cog_reader:
        yield mock_cog_reader


class TestAltitudeEndpoint(BaseTestCase):
    def test_get_altitude_case_1(self, mocked_cog_reader):
        """
        Test get altitude endpoint with valid  key, longitude, latitude and user access token.
        """

        # Arrange.
        params = {
            "longitude": -58.678126,
            "latitude": 73.085427,
            "key": "test_s3_key",
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/altitude", params=params)
        response_data = response.json()["data"]

        # Assert.
        assert response.status_code == status.HTTP_200_OK
        assert response_data == [3744]
        mocked_cog_reader.assert_called_once()

    def test_get_altitude_case_2(self, mocked_cog_reader):
        """
        Test get altitude endpoint with valid key, longitude, latitude and org access token.
        """

        # Arrange.
        params = {
            "longitude": -58.678126,
            "latitude": 73.085427,
            "key": "test_s3_key",
        }
        self.authenticate_with_org_token()

        # Act.
        response = self.client.get("/altitude", params=params)
        response_data = response.json()["data"]

        # Assert.
        assert response.status_code == status.HTTP_200_OK
        assert response_data == [3744]
        mocked_cog_reader.assert_called_once()

    def test_get_altitude_case_3(self):
        """
        Test get altitude endpoint with valid key, longitude, latitude but without authentication.
        """

        # Arrange.
        params = {
            "longitude": -58.678126,
            "latitude": 73.085427,
            "key": "test_s3_key",
        }
        self.unauthenticate()

        # Act.
        response = self.client.get("/altitude", params=params)

        # Assert.
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_altitude_case_4(self, mocked_cog_reader):
        """
        Test get altitude endpoint with invalid longitude and latitude.

        Test by raising PointOutsideBounds
        """
        # Mock - raise exception.
        mocked_cog_reader.side_effect = PointOutsideBounds

        # Arrange.
        params = {
            "longitude": 435345,
            "latitude": 43545.7,
            "key": "test_s3_key",
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/altitude", params=params)
        response_meta = response.json()["meta"]

        # Assert.
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response_meta["slug"] == "point_outside_dataset_bounds"
        mocked_cog_reader.assert_called_once()

    def test_get_altitude_case_5(self, mocked_cog_reader):
        """
        Test get altitude endpoint with invalid key.

        Test by raising RasterIOError
        """
        # Mock - raise exception.
        mocked_cog_reader.side_effect = RasterioIOError

        # Arrange.
        params = {
            "longitude": -58.678126,
            "latitude": 73.085427,
            "key": "test_s3_key",
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/altitude", params=params)
        response_meta = response.json()["meta"]

        # Assert.
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response_meta["slug"] == "something_went_wrong"
        mocked_cog_reader.assert_called_once()

    def test_get_altitude_case_6(self, mocked_cog_reader):
        """
        Test get altitude endpoint with invalid key.

        Test by raising Exception
        """
        # Mock - raise exception.
        mocked_cog_reader.side_effect = Exception

        # Arrange.
        params = {
            "longitude": -58.678126,
            "latitude": 73.085427,
            "key": "test_s3_key",
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/altitude", params=params)
        response_meta = response.json()["meta"]

        # Assert.
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response_meta["slug"] == "something_went_wrong"
        mocked_cog_reader.assert_called_once()
