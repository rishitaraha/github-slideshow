from django.urls import reverse
from rest_framework import status

from rainbow.env_variables import EnvVariable
from shared.exception_handling import ValidationErrors
from shared.tests import BaseTestCase
from user_manager.models import CustomUser


class TestLogin(BaseTestCase):
    def setUp(self):
        self.test_user_2 = CustomUser.objects.create_user(
            email="testusername3@gmail.com",
            password="WUP6SaDv7#eYw78vxYo7yX",
            first_name="first_name2",
            last_name="last_name2",
            org=self.org,
        )

        self.api_authentication(self.user)

    def test_login_case_1(self):
        """
        Testing login endpoint for self.
        """

        name = f"{self.user.first_name} {self.user.last_name}"

        # Arrange.
        data = {
            "email": self.user.email,
            "password": "abcdefGH123#",
        }

        # Act.
        response = self.client.post(reverse("auth-login"), data)

        # Assert.
        self.assertEqual(response.json()["data"]["name"], name)
        self.assertEqual(response.json()["data"]["email"], self.user.email)
        self.assertIsNotNone(response.json()["data"]["access_token"])
        self.assertIsNotNone(response.json()["data"]["refresh_token"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_case_2(self):
        """
        Testing login with insensitive email.
        """

        name = f"{self.user.first_name} {self.user.last_name}"

        # Arrange.
        data = {
            "email": "TestUSerName@gmail.com",
            "password": "abcdefGH123#",
        }

        # Act.
        response = self.client.post(reverse("auth-login"), data)

        # Assert.
        self.assertEqual(response.json()["data"]["name"], name)
        self.assertEqual(response.json()["data"]["email"], self.user.email)
        self.assertIsNotNone(response.json()["data"]["access_token"])
        self.assertIsNotNone(response.json()["data"]["refresh_token"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_case_3(self):
        """
        Testing login with incorrect credentials.
        """

        # Arrange.
        data = {
            "email": "incorrect@email.com",
            "password": "incorrect-password",
        }

        # Act.
        response = self.client.post(reverse("auth-login"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Testing login with masterpassword
    def test_login_case_4(self):
        """
        Testing login with master password.
        """
        name = f"{self.test_user_2.first_name} {self.test_user_2.last_name}"

        # Arrange.
        data = {
            "email": self.test_user_2.email,
            "password": EnvVariable.MASTER_PASSWORD.value,
        }

        # Act.
        response = self.client.post(reverse("auth-login"), data)

        # Assert.
        self.assertEqual(response.json()["data"]["name"], name)
        self.assertEqual(response.json()["data"]["email"], self.test_user_2.email)
        self.assertIsNotNone(response.json()["data"]["access_token"])
        self.assertIsNotNone(response.json()["data"]["refresh_token"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_case_5(self):
        """
        Testing login with incorrect master password.
        """

        # Arrange.
        data = {
            "email": self.test_user_2.email,
            "password": "incorrect-password",
        }

        # Act.
        response = self.client.post(reverse("auth-login"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_case_6(self):
        """
        Testing login for deactivated user
        """

        # Arrange.
        self.test_user_2.is_active = False
        self.test_user_2.save()
        data = {
            "email": self.test_user_2.email,
            "password": EnvVariable.MASTER_PASSWORD.value,
        }

        # Act.
        response = self.client.post(reverse("auth-login"), data)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json()["meta"]["slug"], ValidationErrors.INACTIVE_USER.value.slug
        )

    def test_login_case_7(self):
        """
        Testing login for support user
        """

        # Arrange
        data = {
            "email": self.support_user.email,
            "password": "some-password",
        }

        # Act
        response = self.client.post(reverse("auth-login"), data)

        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
