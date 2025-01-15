from django.urls import reverse
from rest_framework import status

from .base_tests import TestCanListIterations, TestCanManageIterations


class TestManageIterationForOrgAdmin(TestCanManageIterations, TestCanListIterations):
    def setUp(self):
        self.api_authentication(self.org_admin)

    def test_delete_iteration(self):
        # Act.
        response = self.client.delete(
            reverse("iteration-detail", kwargs={"pk": self.iteration.id})
        )
        # Assert.
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
