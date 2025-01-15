from unittest import mock

from django.urls import reverse
from rest_framework import status

from shared.aws import AwsManager
from shared.tests import BaseTestCase
from shared.tests.mock import MockedAwsManager

from .mock import mocked_connect, mocked_create_org, mocked_generate_token


class TestProcessing(BaseTestCase):
    def setUp(self):
        self.api_authentication(self.org_admin)

    # Mocking Processing application's connection api.
    @mock.patch(
        "processing_manager.views.apis.connect",
        return_value=mocked_connect(),
    )
    # Mocking Processing application's create org api.
    @mock.patch(
        "processing_manager.views.apis.create_org",
        return_value=mocked_create_org(),
    )
    # Mocking Processing application's generate token api.
    @mock.patch(
        "processing_manager.views.apis.generate_token",
        return_value=mocked_generate_token(),
    )
    def test_create_processing_org(self, *mock_output):
        # Arrange.
        data = {
            "processing_org_name": "Some org name",
        }

        # Act.
        response = self.client.post(reverse("processing-org"), data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(
            response_data["connection_token"],
            "260cb449c5dc7352fe71f2173d9beba675f90596",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # Mocking Processing application's connection api.
    @mock.patch(
        "processing_manager.views.apis.connect",
        return_value=mocked_connect(),
    )
    # Mocking Processing application's create org api.
    @mock.patch(
        "processing_manager.views.apis.create_org",
        return_value=mocked_create_org(),
    )
    # Mocking Processing application's generate token api.
    @mock.patch(
        "processing_manager.views.apis.generate_token",
        return_value=mocked_generate_token(),
    )
    def test_create_processing_org_without_request_body(self, *mock_output):
        # Arrange.
        data = {}

        # Act.
        response = self.client.post(reverse("processing-org"), data)
        response_meta = response.json()["meta"]

        # Assert.
        self.assertEqual(
            response_meta["slug"],
            "form_validation_error",
        )
        self.assertEqual(
            response_meta["details"]["processing_org_name"][0]["slug"],
            "this_field_is_required",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Test export files endpoints.
    @mock.patch.object(
        AwsManager,
        "invoke_lambda_function",
        return_value=MockedAwsManager.invoke_lambda_function(),
    )
    def test_export_files_endpoint(self, *mock_output):
        # Arrange.
        # TODO: Refactor to test for ortho as well after updating export flow.
        data = {
            "iteration_id": str(self.iteration.id),
            "dsm": {
                "bucket": "cp-outputs-bucket",
                "key": "Task_from_iframe_41642fc5-1322-43c3-a359-0cf176e98b9a_dsm.tif",
            },
            "ortho_layer_name": "Ortho Layer",
            "orthomosaic": {
                "bucket": "cp-outputs-bucket",
                "key": "Task_from_iframe_41642fc5-1322-43c3-a359-0cf176e98b9a_ortho.tif",
            },
        }

        # Act.
        response = self.client.post(reverse("processing-export"), data, format="json")

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)

    # Test export files endpoint without any file.
    def test_export_files_endpoint_without_any_file(self):
        # Arrange.
        data = {
            "iteration_id": str(self.iteration.id),
        }

        # Act.
        response = self.client.post(reverse("processing-export"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Test create mbtiles layer endpoint without feature enabled.
    def test_processing_without_feature_enabled(self):
        # Arrange.
        self.api_authentication(self.org_admin_without_feature_flag)

        data = {
            "iteration_id": str(self.iteration.id),
        }

        # Act.
        response = self.client.post(reverse("processing-export"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
