from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase

from ..models import AccessTag


class TestAccessTagsForOrgAdmin(BaseTestCase):
    def setUp(self):
        self.access_tag1 = AccessTag.objects.create(
            name="Access Tag 1", org=self.org, color="#ffffff"
        )
        self.access_tag2 = AccessTag.objects.create(
            name="Access Tag 2", org=self.org, color="#ffffff"
        )
        self.api_authentication(self.org_admin)

    # Test list access tags endpoint.
    def test_list_access_tags(self):
        params = {"page": 1, "search": "acc"}
        response = self.client.get(reverse("access-tags-list"), params)
        response_data = response.json()["data"]
        self.assertEqual(
            sorted([item["name"] for item in response_data["access_tags"]]),
            sorted(
                [
                    self.access_tag.name,
                    self.access_tag1.name,
                    self.access_tag2.name,
                ]
            ),
        )
        self.assertEqual(
            response_data["total"],
            3,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test create access tag endpoint.
    def test_create_access_tag(self):
        data = {"name": "accesstag1", "color": "#000000"}
        response = self.client.post(reverse("access-tags-list"), data)
        response_data = response.json()["data"]
        self.assertEqual(response_data["name"], data["name"])
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # Test create access tag endpoint validations.
    def test_create_access_tag_validations(self):
        data = {
            "name": "access tag with spaces and more then 32 characters",
            "color": "#00",
        }
        response = self.client.post(reverse("access-tags-list"), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Test update access tag endpoint.
    def test_update_access_tag(self):
        data = {"name": "new_tag"}
        response = self.client.patch(
            reverse("access-tags-detail", kwargs={"pk": self.access_tag1.id}),
            data,
        )
        response_data = response.json()["data"]
        self.assertEqual(response_data["name"], data["name"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test delete access_tag endpoint.
    def test_delete_access_tag(self):
        response = self.client.delete(
            reverse("access-tags-detail", kwargs={"pk": self.access_tag1.id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
