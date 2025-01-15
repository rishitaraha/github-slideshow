from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase

from ..models import UserGroup


class TestUserGroup(BaseTestCase):
    def setUp(self):
        self.test_group = UserGroup.objects.create(
            name="group name",
            org=self.org,
        )
        self.test_group.users.add(self.user.id)
        self.test_group.access_tags.add(self.access_tag.id)
        self.api_authentication(self.org_admin)

    # Only allowed if requester is org admin.
    def test_org_admin_create_user_group(self):
        data = {
            "name": "gname",
        }
        response = self.client.post(reverse("user-groups-list"), data)
        response_data = response.json()["data"]
        self.assertEqual(response_data["name"], data["name"])
        self.assertEqual(len(response_data["users"]), 0)
        self.assertEqual(len(response_data["access_tags"]), 0)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # Only allowed if requester is org admin.
    def test_cannot_create_user_group(self):
        # Create a group in same org with same name and it gives error.
        data = {
            "name": "group name",
            "users": [self.user.id],
            "access_tags": [self.access_tag.id],
        }
        response = self.client.post(reverse("user-groups-list"), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Only list user groups for Org admin.
    def test_list_user_groups(self):
        response = self.client.get(reverse("user-groups-list"))

        # Ordering is based on Group name.
        self.assertEqual(
            sorted([item["id"] for item in response.json()["data"]["user_groups"]]),
            sorted(
                [
                    str(self.user_group.id),
                    str(self.user_group_with_manage_iteration.id),
                    str(self.test_group.id),
                ]
            ),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test search user group endpoint by Org admin.
    def test_search_user_groups(self):
        params = {"search": "group", "page": "1"}
        response = self.client.get(reverse("user-groups-list"), params)
        response_data = response.json()["data"]
        self.assertEqual(
            sorted([item["id"] for item in response_data["user_groups"]]),
            sorted([str(self.test_group.id)]),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Org admin can get user groups and users in it.
    def test_get_user_group_details_and_users(self):
        response = self.client.get(
            reverse("user-groups-detail", kwargs={"pk": self.test_group.id})
        )
        self.assertEqual(response.json()["data"]["name"], self.test_group.name)
        self.assertEqual(
            response.json()["data"]["users"],
            [str(self.user.id)],
        )
        self.assertEqual(
            response.json()["data"]["access_tags"],
            [str(self.access_tag.id)],
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test update user group endpoint.
    def test_update_user_group(self):
        data = {
            "name": "Updated group Name",
            "users": [self.user.id, self.org_admin.id],
            "access_tags": [self.access_tag.id],
        }
        response = self.client.patch(
            reverse("user-groups-detail", kwargs={"pk": self.test_group.id}),
            data,
        )
        response_data = response.json()["data"]
        self.assertEqual(response_data["name"], data["name"])
        self.assertEqual(len(response_data["users"]), 2)
        self.assertEqual(len(response_data["access_tags"]), 1)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test delete user group endpoint.
    def test_delete_user_group(self):
        response = self.client.delete(
            reverse("user-groups-detail", kwargs={"pk": self.test_group.id})
        )
        # Checking that status code is 204 or not.
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_deactivated_user_is_removed_from_group(self):
        # Add the User to 2 groups.
        self.test_group2 = UserGroup.objects.create(
            name="New Group",
            org=self.org,
        )
        self.test_group2.users.add(self.user.id)
        self.assertEqual(len(UserGroup.objects.filter(users__in=[self.user.id])), 3)

        # Make the user inactive.
        data = {"is_active": False}
        self.client.patch(reverse("users-detail", kwargs={"pk": self.user.id}), data)

        # Now the user is not assigned to any user group.
        self.assertEqual(len(UserGroup.objects.filter(users__in=[self.user.id])), 0)
