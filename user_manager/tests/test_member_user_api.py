from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase

from ..models import CustomUser


class TestMemberUser(BaseTestCase):
    def setUp(self):
        self.test_user = CustomUser.objects.create_user(
            email="testusername2@gmail.com",
            password="bLaAD4*BCCqs5xFtjMU5YE",
            first_name="first_name2",
            last_name="last_name2",
            org=self.org,
        )
        self.api_authentication(self.test_user)

    # Test user creation is disallowed by anyone except Org admin.
    def test_create_user(self):
        data = {
            "first_name": "fname",
            "last_name": "lname",
            "email": "emailfortest@gmail.com",
            "password": "bLaAD4*BCCqs5xFtjMU5YE",
        }
        response = self.client.post(reverse("users-list"), data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test list user endpoint without org admin.
    def test_list_users(self):
        response = self.client.get(reverse("users-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test list user endpoint without authentication.
    def test_list_users_un_authenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(reverse("users-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # Test search user endpoint by non org admin.
    def test_search_users(self):
        params = {"search": "first_name"}
        response = self.client.get(reverse("users-list"), params)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test get user endpoint.
    def test_get_user_by_other_member(self):
        response = self.client.get(reverse("users-detail", kwargs={"pk": self.user.id}))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test update user endpoint.
    def test_update_user_by_other_member(self):
        data = {"first_name": "Updated Name"}
        response = self.client.patch(
            reverse("users-detail", kwargs={"pk": self.user.id}), data
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test change password of a user endpoint.
    def test_change_password_by_other_member(self):
        data = {
            "user_id": self.user.id,
            "new_password": "newpass",
            "confirm_new_password": "newpass",
        }
        response = self.client.patch(reverse("users-change-password"), data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
