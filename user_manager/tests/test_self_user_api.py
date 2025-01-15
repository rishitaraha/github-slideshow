from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase

from ..constants import UserType


class TestSelfUser(BaseTestCase):
    def setUp(self):
        self.api_authentication(self.user)

    # Test get user retrieve endpoint by self.
    def test_get_self_user(self):
        response = self.client.get(reverse("users-detail", kwargs={"pk": self.user.id}))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test get logged user endpoint.
    def test_get_logged_user(self):
        response = self.client.get(reverse("users-logged"))
        self.assertEqual(response.json()["data"]["email"], self.user.email)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test update user endpoint.
    def test_update_user(self):
        data = {
            "first_name": "Updated Name",
            "last_name": "Updated Name",
            "is_active": False,
            "email": "newemailforuser@gmail.com",
            "type": UserType.ORG_ADMIN.value,
        }
        response = self.client.patch(
            reverse("users-detail", kwargs={"pk": self.user.id}), data
        )
        response_data = response.json()["data"]

        # No fields other than following are changed by self.
        self.assertEqual(response_data["first_name"], data["first_name"])
        self.assertEqual(response_data["last_name"], data["last_name"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # TODO: Fix this test.
    # Test change current user password endpoint.
    def test_change_password(self):
        data = {
            "old_password": "abcdefGH123#",
            "new_password": "aAD4*BCCqs5xFtjMU5",
            "confirm_new_password": "aAD4*BCCqs5xFtjMU5",
        }
        response = self.client.patch(reverse("users-change-password"), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
