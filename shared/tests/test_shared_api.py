from django.urls import reverse
from rest_framework import status

from .base_test_case import BaseTestCase


class TestSharedEndpoints(BaseTestCase):
    def test_welcome_message(self):
        response = self.client.get(reverse("index"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, "Welcome to Aereo Cloud")

    def test_ping(self):
        response = self.client.get(reverse("ping"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
