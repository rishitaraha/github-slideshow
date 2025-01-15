from django.urls import reverse
from rest_framework import status

from shared.tests import BaseTestCase

from ..models import AccessTag


class TestAccessTagsForMember(BaseTestCase):
    def setUp(self):
        self.access_tag1 = AccessTag.objects.create(
            name="Access Tag 1", org=self.org, color="#ffffff"
        )
        self.access_tag2 = AccessTag.objects.create(
            name="Access Tag 2", org=self.org, color="#ffffff"
        )
        self.user_group.access_tags.add(self.access_tag1)
        self.api_authentication(self.user)

    # Test list access tags endpoint.
    def test_list_access_tags(self):
        response = self.client.get(reverse("access-tags-list"), {"page": 1})
        response_data = response.json()["data"]
        self.assertEqual(
            sorted([item["name"] for item in response_data["access_tags"]]),
            sorted(
                [
                    self.access_tag.name,
                    self.access_tag1.name,
                ]
            ),
        )
        self.assertEqual(response_data["total"], 2)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test create access tag endpoint.
    def test_create_access_tag(self):
        data = {"name": "accesstag1", "color": "#000000"}
        response = self.client.post(reverse("access-tags-list"), data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test update access tag endpoint.
    def test_update_access_tag(self):
        data = {"name": "new_tag"}
        response = self.client.patch(
            reverse("access-tags-detail", kwargs={"pk": self.access_tag.id}),
            data,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Test delete access_tag endpoint.
    def test_delete_access_tag(self):
        response = self.client.delete(
            reverse("access-tags-detail", kwargs={"pk": self.access_tag.id})
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
