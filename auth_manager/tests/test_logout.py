from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase


class TestLogout(BaseTestCase):
    def setUp(self):
        self.api_authentication(self.user)

    def test_logout_case_1(self):
        """
        Test logout endpoint for self.
        """

        # Arrange.
        data = {
            "refresh_token": str(self.token),
        }

        # Act.
        response = self.client.post(reverse("auth-logout"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)

    def test_logout_case_2(self):
        """
        Test logout endpoint with wrong refresh token.
        """

        # Arrange.
        data = {
            "refresh_token": "wrong-refresh-token",
        }

        # Act.
        response = self.client.post(reverse("auth-logout"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
