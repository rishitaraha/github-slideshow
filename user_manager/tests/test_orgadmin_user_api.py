from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase

from ..constants import UserType
from ..models import CustomUser


class TestOrgAdminUser(BaseTestCase):
    def setUp(self):
        self.test_user = CustomUser.objects.create_user(
            email="testusername2@gmail.com",
            password="d@ZFuJ354M6$MT",
            first_name="first_name2",
            last_name="last_name2",
            org=self.org,
        )
        self.api_authentication(self.org_admin)

    # Only allowed if requester is org admin.
    def test_org_admin_create_user(self):
        data = {
            "first_name": "fname",
            "last_name": "lname",
            "email": "emailfortest@gmail.com",
            "password": "!Newpass@123",
            "is_active": False,
            "type": UserType.MEMBER.value,
        }
        response = self.client.post(reverse("users-list"), data)
        response_data = response.json()["data"]
        self.assertEqual(response_data["email"], data["email"])
        self.assertEqual(response_data["is_active"], True)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # Only allowed if requester is org admin.
    def test_org_admin_create_org_admin_user(self):
        data = {
            "first_name": "admin",
            "last_name": "lname",
            "email": "emailforadmin@gmail.com",
            "password": "!Newpass@123",
            "type": UserType.ORG_ADMIN.value,
        }
        response = self.client.post(reverse("users-list"), data)
        response_data = response.json()["data"]
        self.assertEqual(response_data["email"], data["email"])
        self.assertEqual(response_data["type"], UserType.ORG_ADMIN.value)
        self.assertEqual(response_data["is_active"], True)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # Only list users for Org admin.
    def test_list_users(self):
        response = self.client.get(reverse("users-list"))

        # Ordering is based on alphabetical rank of first name, last name.
        self.assertEqual(
            [item["id"] for item in response.json()["data"]["users"]],
            [
                str(self.test_user.id),
                str(self.org_admin.id),
                str(self.user_2.id),
                str(self.user.id),
            ],
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Only list users for Org admin.
    def test_list_deactivated_users(self):
        response = self.client.patch(
            reverse("users-detail", kwargs={"pk": self.test_user.id}),
            {"is_active": False},
        )
        response = self.client.get(reverse("users-list"), {"deactivated_users": 1})
        self.assertEqual(
            [item["id"] for item in response.json()["data"]["users"]],
            [str(self.test_user.id)],
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.patch(
            reverse("users-detail", kwargs={"pk": self.test_user.id}),
            {"is_active": True},
        )

    # Only list users for Org admin.
    def test_list_only_members(self):
        response = self.client.get(reverse("users-list"), {"members_only": 1})
        self.assertEqual(len(response.json()["data"]["users"]), 3)
        self.assertEqual(
            [item["id"] for item in response.json()["data"]["users"]],
            [
                str(self.test_user.id),
                str(self.user_2.id),
                str(self.user.id),
            ],
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test search user endpoint by Org admin.
    def test_search_users(self):
        params = {"search": "first_name"}
        response = self.client.get(reverse("users-list"), params)
        response_data = response.json()["data"]
        self.assertEqual(
            sorted([item["id"] for item in response_data["users"]]),
            sorted([str(self.test_user.id)]),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test get user endpoint by org admin.
    def test_get_user(self):
        response = self.client.get(reverse("users-detail", kwargs={"pk": self.user.id}))
        self.assertEqual(response.json()["data"]["email"], self.user.email)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test update user endpoint.
    def test_update_user(self):
        data = {
            "first_name": "Updated Name",
            "last_name": "Updated Last Name",
            "email": "newemail@gmail.com",
            "is_active": not self.user.is_active,
        }
        response = self.client.patch(
            reverse("users-detail", kwargs={"pk": self.test_user.id}), data
        )
        response_data = response.json()["data"]
        self.assertEqual(response_data["is_active"], data["is_active"])
        self.assertEqual(response_data["first_name"], data["first_name"])
        self.assertEqual(response_data["last_name"], data["last_name"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test change password of a user endpoint.
    def test_change_password(self):
        data = {
            "user_id": self.user.id,
            "new_password": "!Newpass@123",
            "confirm_new_password": "!Newpass@123",
        }
        response = self.client.patch(reverse("users-change-password"), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_change_to_weak_password(self):
        data = {
            "user_id": self.user.id,
            "new_password": "newpass",
            "confirm_new_password": "newpass",
        }
        response = self.client.patch(reverse("users-change-password"), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
