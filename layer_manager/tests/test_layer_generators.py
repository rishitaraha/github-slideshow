from unittest import mock

from django.urls import reverse
from rest_framework import status

from shared.aws import AwsManager
from shared.tests import BaseTestCase
from shared.tests.mock import MockedAwsManager


class TestLayerGenerators(BaseTestCase):
    def setUp(self):
        self.api_authentication(self.user)

    @mock.patch.object(
        AwsManager,
        "invoke_lambda_function",
        return_value=MockedAwsManager.invoke_lambda_function(),
    )
    def test_contour_generator(self, *mock_output):
        # Arrange.
        data = {
            "name": "Contour Layer Name",
            "iteration": str(self.iteration.id),
            "access_tags": [self.access_tag.id],
            "minor_interval": 0.5,
            "major_interval": 2,
            "lowest_altitude": 0,
            "highest_altitude": 300,
            "threshold_value": 30,
            "smoothing_filter_size": 20,
        }

        # Act.
        response = self.client.post(reverse("layers-generate-contour"), data=data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response_data["iteration"], data["iteration"])
        self.assertEqual(response_data["name"], data["name"])
        self.assertIsNotNone(response_data["files"])

    @mock.patch.object(
        AwsManager,
        "submit_batch_job",
        return_value=MockedAwsManager.submit_batch_job(),
    )
    def test_slope_map_generator(self, *mock_output):
        # Arrange.
        data = {
            "name": "Slope Map Layer Name",
            "iteration": str(self.iteration.id),
            "access_tags": [self.access_tag.id],
        }

        # Act.
        response = self.client.post(reverse("layers-generate-slope-map"), data=data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response_data["iteration"], data["iteration"])
        self.assertEqual(response_data["name"], data["name"])
        self.assertIsNotNone(response_data["files"])
