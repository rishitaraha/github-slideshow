from unittest import SkipTest

from django.urls import reverse
from rest_framework import status

from ..base_test_case import ProcessingBaseTestCase


class TestCannotManageIterationDataset(ProcessingBaseTestCase):
    def setUp(self):
        raise SkipTest("Helper test")

    def test_iteration_dataset_creation_without_feature_enabled(self):
        self.api_authentication(self.org_admin_without_feature_flag)
        data = {"random": self.iteration.id}
        response = self.client.post(reverse("iteration-dataset-list"), data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_iteration_dataset_fetch_without_feature_enabled(self):
        self.api_authentication(self.org_admin_without_feature_flag)
        response = self.client.get(
            reverse(
                "iteration-dataset-detail",
                kwargs={"pk": str(self.iteration_dataset_wgs84.id)},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_iteration_dataset_update_without_feature_enabled(self):
        self.api_authentication(self.org_admin_without_feature_flag)
        response = self.client.patch(
            reverse(
                "iteration-dataset-detail",
                kwargs={"pk": self.iteration_dataset_wgs84.pk},
            )
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
