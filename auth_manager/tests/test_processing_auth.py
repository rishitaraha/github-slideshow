from uuid import uuid4

from django.urls import reverse
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from org_manager.models import Organisation
from processing_manager.models import Connection as ProcessingConnection
from shared.tests import BaseTestCase
from user_manager.constants import UserType
from user_manager.models import CustomUser


class TestProcessingAuth(BaseTestCase):
    def setUp(self):
        self.processing_connection = ProcessingConnection.objects.create(
            org=self.org,
            processing_org_id=uuid4(),
            processing_org_name="Processing Test Org",
            connection_token="KJSFLKEWJOTRUE0FJDSLKU435U0ROS80385RSLR3405UWEOFJSDO",
        )

        token = RefreshToken.for_user(self.org_admin)
        self.ra_access_token = str(token.access_token)

    def test_processing_auth_case_1(self):
        """
        Test processing auth endpoint with correct ra_access_token (of org admin) and connection_token.
        """

        # Arrange.
        data = {
            "ra_access_token": self.ra_access_token,
            "org_connection_token": self.processing_connection.connection_token,
        }

        # Act.
        response = self.client.post(reverse("auth-processing"), data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data["email"], self.org_admin.email)
        self.assertEqual(response_data["role"], self.org_admin.type)

    def test_processing_auth_case_2(self):
        """
        Test processing auth endpoint with incorrect ra_access_token (of org admin) and connection_token.
        """

        # Arrange.
        data = {
            "ra_access_token": "incorrect_access_token",
            "org_connection_token": "incorrect_org_connection_token",
        }

        # Act.
        response = self.client.post(reverse("auth-processing"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_processing_auth_case_3(self):
        """
        Test processing auth endpoint with incorrect ra_access_token (of org admin) and correct connection_token.
        """

        # Arrange.
        data = {
            "ra_access_token": "incorrect_access_token",
            "org_connection_token": self.processing_connection.connection_token,
        }

        # Act.
        response = self.client.post(reverse("auth-processing"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_processing_auth_case_4(self):
        """
        Test processing auth endpoint with correct ra_access_token (of org admin) and incorrect connection_token.
        """

        # Arrange.
        data = {
            "ra_access_token": self.ra_access_token,
            "org_connection_token": "incorrect_org_connection_token",
        }

        # Act.
        response = self.client.post(reverse("auth-processing"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_processing_auth_case_5(self):
        """
        Test processing auth endpoint with ra_access_token (of org admin) and connection_token of two different organisations.
        """

        # Arrange.
        org2 = Organisation.objects.create(name="Test Org 2")
        user2 = CustomUser.objects.create_user(
            email="user2@gmail.com",
            password="bLaAD4*BCCqs5xFtjMU5YE",
            first_name="Test",
            last_name="User2",
            org=org2,
            type=UserType.ORG_ADMIN.value,
        )
        user2_token = RefreshToken.for_user(user2)
        user2_access_token = str(user2_token.access_token)

        data = {
            "ra_access_token": user2_access_token,
            "org_connection_token": self.processing_connection.connection_token,
        }

        # Act.
        response = self.client.post(reverse("auth-processing"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_processing_auth_case_6(self):
        """
        Test processing auth endpoint with correct ra_access_token (of member user) and connection_token.
        """

        # Arrange.
        member_user_access_token = RefreshToken.for_user(self.user)

        data = {
            "ra_access_token": str(member_user_access_token.access_token),
            "org_connection_token": self.processing_connection.connection_token,
        }

        # Act.
        response = self.client.post(reverse("auth-processing"), data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data["email"], self.user.email)
        self.assertEqual(response_data["role"], self.user.type)
