from datetime import datetime
from unittest import SkipTest

from django.urls import reverse
from rest_framework import status

from iteration_manager.models import Iteration
from shared.tests import BaseTestCase


class TestCannotListIterations(BaseTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.test_iteration = Iteration.objects.create(
            name="Test Iteration 2",
            date=datetime.now(),
            site=cls.site,
        )

    def setUp(self):
        # Raise this exception in a test to skip it.
        # We want this test class to run only when inherited.
        raise SkipTest("Abstract test")

    # Test list iterations endpoint with view permission.
    def test_cannot_list_iteration(self):
        params = {"site_id": self.site.id, "search": "test"}
        response = self.client.get(reverse("iteration-list"), params)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_check_terrain_tiles_permission(self):
        # Arrange.
        data = {
            "iteration": self.iteration.id,
            "s3_key": "OUTPUT_S3_KEY",
        }

        # Act.
        response = self.client.post(
            reverse("iteration-check-terrain-tiles-permission"), data
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
