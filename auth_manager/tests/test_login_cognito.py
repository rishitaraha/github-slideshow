from unittest import mock

from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase
from user_manager.models import CustomUser
from user_manager.tests import mocked_get_user_info

from ..tests.mock import mocked_get_cognito_token, mocked_get_cognito_token_failed


class TestLoginCognito(BaseTestCase):
    def setUp(self):
        self.test_user = CustomUser.objects.create_user(
            email="testusername2@gmail.com",
            password="bLaAD4*BCCqs5xFtjMU5YE",
            first_name="first_name2",
            last_name="last_name2",
            org=self.org,
        )
        self.api_authentication(self.test_user)

    @mock.patch(
        "auth_manager.views.get_cognito_access_token",
        return_value=mocked_get_cognito_token(),
    )
    @mock.patch(
        "auth_manager.views.get_cognito_user_info",
        return_value=mocked_get_user_info(),
    )
    def test_login_cognito_case_1(self, *mock_output):
        """
        Testing login cognito for self.
        """
        name = f"{self.user.first_name} {self.user.last_name}"

        # Arrange.
        data = {"code": "d702c078-c698-43ce-b028-84845a9c4a63"}

        # Act.
        response = self.client.post(reverse("auth-login-cognito"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"]["name"], name)
        self.assertEqual(response.json()["data"]["login_mode"], "SSO")
        self.assertIsNotNone(response.json()["data"]["access_token"])
        self.assertIsNotNone(response.json()["data"]["refresh_token"])

    @mock.patch(
        "auth_manager.views.get_cognito_access_token",
        return_value=mocked_get_cognito_token_failed(),
    )
    @mock.patch(
        "auth_manager.views.get_cognito_user_info",
        return_value=mocked_get_user_info(),
    )
    def test_login_cognito_case_2(self, *mock_output):
        """
        Testing login cognito for wrong token.
        """

        # Arrange.
        data = {"code": "0702c078-c698-43ce-b028-84845a9c4a68"}

        # Act.
        response = self.client.post(reverse("auth-login-cognito"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
