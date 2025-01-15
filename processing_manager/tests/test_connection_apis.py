from unittest import mock

from django.urls import reverse
from rest_framework import status

from processing_manager.models import Connection
from shared.tests import BaseTestCase

from .mock import mocked_connect, mocked_disconnect


class TestConnection(BaseTestCase):
    def setUp(self):
        self.connection = Connection.objects.create(
            org=self.org,
            processing_org_id="d0a47b19-48f9-46b9-93f9-ad4ed7906179",
            processing_org_name="Test Org",
        )
        self.api_authentication(self.org_admin)

    # Mocking Processing application's connection api.
    @mock.patch(
        "processing_manager.views.apis.connect",
        return_value=mocked_connect(),
    )
    def test_create_connection(self, *mock_output):
        # Arrange.
        data = {
            "processing_org_id": "a6b7d430-72f8-4908-b819-f4485bfba4ae",
            "connection_token": "8503ed0ee97272a3c11d8dcc59ec5e438a436293",
        }

        # Act.
        response = self.client.post(reverse("processing-connect"), data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response_data["processing_org_id"], data["processing_org_id"])
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # Mocking Processing application's connection api.
    @mock.patch(
        "processing_manager.views.apis.connect",
        return_value=mocked_connect(),
    )
    def test_create_connection_with_empty_request_body(self, *mock_output):
        # Arrange.
        data = {}

        # Act.
        response = self.client.post(reverse("processing-connect"), data)
        response_details = response.json()["meta"]["details"]

        # Assert.
        self.assertEqual(
            response_details["processing_org_id"][0]["slug"],
            "this_field_is_required",
        )
        self.assertEqual(
            response_details["connection_token"][0]["slug"],
            "this_field_is_required",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Mocking Processing application's connection api.
    @mock.patch(
        "processing_manager.views.apis.connect",
        return_value=mocked_connect(),
    )
    def test_create_connection_with_invalid_uuid(self, *mock_output):
        # Arrange.
        data = {
            "processing_org_id": "d0a47b19-48f9-46b9-93f9-ad4ed7901231239",
            "connection_token": "8503ed0ee97272a3c11asdasdadasda293",
        }

        # Act.
        response = self.client.post(reverse("processing-connect"), data)
        response_details = response.json()["meta"]["details"]

        # Assert.
        self.assertEqual(
            response_details["processing_org_id"][0]["slug"],
            "must_be_a_valid_uuid",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Mocking Processing application's connection api.
    @mock.patch(
        "processing_manager.views.apis.connect",
        return_value=mocked_connect(),
    )
    def test_create_connection_with_invalid_connection_token(self, *mock_output):
        # Arrange.
        data = {
            "processing_org_id": "d0a47b19-48f9-46b9-93f9-ad4ed7901231239",
            "connection_token": "8503ed0ee97272a3c11asdasdadasda293",
        }

        # Act.
        response = self.client.post(reverse("processing-connect"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Test get connection endpoint.
    def test_get_connection(self):
        response = self.client.get(reverse("processing-connection"))
        response_data = response.json()["data"]
        self.assertEqual(
            response_data["processing_org_id"],
            self.connection.processing_org_id,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Mocking Processing application's disconnect api.
    @mock.patch(
        "processing_manager.views.apis.disconnect",
        return_value=mocked_disconnect(),
    )
    def test_destroy_connections(self, *mock_output):
        response = self.client.delete(
            reverse("processing-disconnect"),
        )

        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)
