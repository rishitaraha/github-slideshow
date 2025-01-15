from unittest import mock

from django.urls import reverse
from rest_framework import status

from shared.aws import AwsManager
from shared.tests import BaseTestCase
from shared.tests.mock import MockedAwsManager, create_test_image
from user_manager.constants import UserType
from user_manager.models import CustomUser

from ..models import Organisation


class TestOrg(BaseTestCase):
    def setUp(self):
        self.test_org = Organisation.objects.create(name="AUS")
        self.support_user = CustomUser.objects.create_user(
            email="admin_user@gmail.com",
            password="bLaAD4*BCCqs5xFtjMU5YE",
            first_name="first_name",
            type=UserType.SUPPORT.value,
        )
        self.api_authentication(self.support_user)

    # Test list org endpoint with authentication.
    def test_list_org_authenticated(self):
        response = self.client.get(reverse("organisation-list"))
        response_data = response.json()["data"]
        self.assertEqual(
            sorted([item["name"] for item in response_data["organisations"]]),
            sorted(
                [
                    self.org.name,
                    self.test_org.name,
                    self.org_without_feature_flag.name,
                    self.org2.name,
                ]
            ),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test list org endpoint without authentication.
    def test_list_org_un_authenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(reverse("organisation-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # Test get org endpoint.
    def test_get_org(self):
        response = self.client.get(
            reverse("organisation-detail", kwargs={"pk": self.org.id})
        )
        response_data = response.json()["data"]
        self.assertEqual(response_data["name"], self.org.name)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test get my org endpoint.
    def test_get_my_org(self):
        self.api_authentication(self.user)

        response = self.client.get(reverse("organisation-my-org"))
        response_data = response.json()["data"]
        self.assertEqual(response_data["name"], self.user.org.name)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test upload logo by org_admin.
    # Mocked get_download_signed_url and upload_file methods of AwsManager.
    @mock.patch.object(
        AwsManager,
        "upload_file",
        return_value=MockedAwsManager.upload_file(),
    )
    @mock.patch.object(
        AwsManager,
        "get_download_signed_url",
        return_value=MockedAwsManager.get_download_signed_url(),
    )
    def test_upload_logo_by_org_admin(self, *mock_output):
        self.api_authentication(self.org_admin)
        data = {"logo": create_test_image()}
        response = self.client.post(reverse("organisation-logo"), data)
        response_data = response.json()["data"]

        self.assertEqual(response_data["name"], self.org_admin.org.name)
        self.assertEqual(
            response_data["logo"], MockedAwsManager.get_download_signed_url()
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test upload logo by member user.
    def test_upload_logo_by_member(self):
        self.api_authentication(self.user)
        response = self.client.post(reverse("organisation-logo"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
