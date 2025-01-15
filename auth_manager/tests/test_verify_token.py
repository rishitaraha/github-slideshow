from django.urls import reverse
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from shared.tests import BaseTestCase


class TestVerifyToken(BaseTestCase):
    def setUp(self):
        token = RefreshToken.for_user(self.user)
        self.user_access_token = str(token.access_token)

    def test_verify_token_case_1(self):
        """
        Test verify token endpoint with a correct user access token.
        """

        # Arrange.
        data = {
            "token": self.user_access_token,
            "type": "user_access_token",
        }

        # Act.
        response = self.client.post(reverse("auth-token-verify"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_verify_token_case_2(self):
        """
        Test verify token endpoint with an incorrect user access token.
        """

        # Arrange.
        data = {
            "token": "an incorrect user access token",
            "type": "user_access_token",
        }

        # Act.
        response = self.client.post(reverse("auth-token-verify"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_verify_token_case_3(self):
        """
        Test verify token endpoint with a correct org access token.
        """
        # Arrange.
        data = {
            "token": self.org_access_token.token,
            "type": "org_access_token",
        }

        # Act.
        response = self.client.post(reverse("auth-token-verify"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_verify_token_case_4(self):
        """
        Test verify token endpoint with an incorrect org access token.
        """

        # Arrange.
        data = {
            "token": "an incorrect org access token",
            "type": "org_access_token",
        }

        # Act.
        response = self.client.post(reverse("auth-token-verify"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_verify_token_case_5(self):
        """
        Test verify token endpoint with invalid token type.
        """

        # Arrange.
        data = {
            "token": self.org_access_token.token,
            "type": "invalid_token_type",
        }

        # Act.
        response = self.client.post(reverse("auth-token-verify"), data)
        response_meta = response.json()["meta"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response_meta["slug"], "invalid_token_type")
