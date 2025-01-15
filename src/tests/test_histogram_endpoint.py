from unittest import mock

from fastapi import status
from pytest import fixture
from rasterio import RasterioIOError
from rio_tiler.errors import TileOutsideBounds

from .base_test import BaseTestCase
from .mocks import MockCOGReader


@fixture
def mocked_cog_reader():
    with mock.patch(
        "src.routers.histogram.COGReader", MockCOGReader()
    ) as mock_cog_reader:
        yield mock_cog_reader


class TestHistogramEndpoint(BaseTestCase):
    def test_cog_histogram_case_1(self, mocked_cog_reader: MockCOGReader):
        """
        Test histogram endpoint with valid key and user access token.
        """

        # Arrange.
        params = {
            "key": "test_s3_key",
            "rescale": "37,203",
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/histogram/7/6080/3537.png", params=params)

        # Assert.
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["Content-Type"] == "image/png"
        assert response.text is not None
        mocked_cog_reader.assert_called_once()

    def test_cog_histogram_case_2(self, mocked_cog_reader: MockCOGReader):
        """
        Test histogram endpoint with valid key and org access token.
        """

        # Arrange.
        params = {
            "key": "test_s3_key",
            "rescale": "37,203",
        }
        self.authenticate_with_org_token()

        # Act.
        response = self.client.get("/histogram/7/6080/3537.png", params=params)

        # Assert.
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["Content-Type"] == "image/png"
        assert response.text is not None
        mocked_cog_reader.assert_called_once()

    def test_cog_histogram_case_3(self):
        """
        Test histogram endpoint with valid key but without authentication.
        """

        # Arrange.
        params = {
            "key": "test_s3_key",
            "rescale": "37,203",
        }
        self.unauthenticate()

        # Act.
        response = self.client.get("/histogram/7/6080/3537.png", params=params)

        # Assert.
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_cog_histogram_case_4(self, mocked_cog_reader):
        """
        Test histogram endpoint with invalid key and user access token.

        Test by raising RasterIOError
        """
        # Mock - raise exception.
        mocked_cog_reader.side_effect = RasterioIOError

        # Arrange.
        params = {
            "key": "invalid_key",
            "rescale": "37,203",
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/histogram/7/6080/3537.png", params=params)
        response_meta = response.json()["meta"]

        # Assert.
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response_meta["slug"] == "tile_not_found"
        mocked_cog_reader.assert_called_once()

    def test_cog_histogram_case_5(self, mocked_cog_reader):
        """
        Test cog histogram endpoint with invalid key and user access token.

        Test by raising Exception
        """
        # Mock - raise exception.
        mocked_cog_reader.side_effect = Exception

        # Arrange.
        params = {
            "key": "invalid_key",
            "rescale": "37,203",
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/histogram/7/6080/3537.png", params=params)
        response_meta = response.json()["meta"]

        # Assert.
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response_meta["slug"] == "tile_not_found"
        mocked_cog_reader.assert_called_once()

    def test_cog_histogram_case_6(self, mocked_cog_reader):
        """
        Test cog histogram endpoint with invalid Z,X,Y and user access token.

        Test by raising TileOutsideBounds
        """
        # Mock - raise exception.
        mocked_cog_reader.side_effect = TileOutsideBounds

        # Arrange.
        params = {
            "key": "key",
            "rescale": "37,203",
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/histogram/70/6080/3537.png", params=params)
        response_meta = response.json()["meta"]

        # Assert.
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response_meta["slug"] == "tile_outside_bound"
        mocked_cog_reader.assert_called_once()

    def test_cog_histogram_case_7(self):
        """
        Test cog histogram endpoint with empty rescale and user access token.
        """

        # Arrange.
        params = {
            "key": "valid_key",
            "rescale": "",
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/histogram/7/6080/3537.png", params=params)
        response_meta = response.json()["meta"]

        # Assert.
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response_meta["slug"] == "invalid_rescale_value"

    def test_cog_histogram_case_8(self):
        """
        Test cog histogram endpoint with invalid rescale and user access token.
        """

        # Arrange.
        params = {
            "key": "valid_key",
            "rescale": "abs,def",
        }
        self.authenticate_with_user_token()

        # Act.
        response = self.client.get("/histogram/7/6080/3537.png", params=params)
        response_meta = response.json()["meta"]

        # Assert.
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response_meta["slug"] == "invalid_rescale_value"
