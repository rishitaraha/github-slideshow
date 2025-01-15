from unittest import mock

from django.urls import reverse
from rest_framework import status

from analytics_engine_manager.tests.mock import mocked_volume_calculation
from project_manager.models import ProjectPermission
from shared.aws import AwsManager
from shared.tests import BaseTestCase
from shared.tests.constants import WKTGeometry
from shared.tests.mock import MockedAwsManager
from site_manager.models import SitePermission

from ..constants import (
    BaseReference,
    HeapCategory,
    HeapMaterialTypes,
    VolumeReportFormat,
)
from ..models import HeapBoundary


class TestHeapBoundary(BaseTestCase):
    def setUp(self):
        # Project permission for a user group to view.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=True,
            can_manage_sites=False,
        )
        # Site permission for a user group to view.
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=True,
            can_manage_iterations_and_layers=False,
        )

        self.heap_boundary2 = HeapBoundary.objects.create(
            name="Test Heap 2",
            iteration=self.iteration,
            geometry=WKTGeometry.MULTIPOLYGON.value,
            remarks="just another test heap",
            bulk_density=23.8,
            centroid=11,
            cut_volume=28.4,
            fill_volume=10,
            net_volume=18.4,
            cut_weight=363.52,
            fill_weight=128,
            net_weight=235.52,
        )
        self.api_authentication()

    # Test add heap endpoint.
    @mock.patch(
        "iteration_manager.serializers.create_heap_boundary_serializer.calculate_volume",
        return_value=mocked_volume_calculation(),
    )
    def test_create_heap_boundary(self, mock_output):
        # Arrange.
        data = {
            "name": "Test Heap",
            "iteration": self.iteration.id,
            "geometry": "MULTIPOLYGON (((79.2028477743085 30.194495687364736,79.20289771023361 30.19055235019735,79.20792693772127 30.190434498510253,79.2028477743085 30.194495687364736)))",
            "remarks": "just another test heap",
            "bulk_density": 23.8,
            "centroid": 11,
            "base_reference": BaseReference.VisibleGround.value,
            "material_type": HeapMaterialTypes.Ore.value,
            "category": HeapCategory.EXCAVATED_VOLUME.value,
            "included_in_kpi": True,
        }

        # Act.
        response = self.client.post(reverse("heap-boundary-list"), data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response_data["name"], data["name"])
        self.assertEqual(response_data["material_type"], HeapMaterialTypes.Ore.value)
        self.assertEqual(response_data["category"], HeapCategory.EXCAVATED_VOLUME.value)
        self.assertEqual(response_data["included_in_kpi"], True)

    # Test list heap endpoint with authentication.
    def test_list_heap_boundary_authenticated(self):
        response = self.client.get(
            reverse("heap-boundary-list"), {"iteration_id": self.iteration.id}
        )
        response_data = response.json()["data"]
        self.assertEqual(
            sorted([item["name"] for item in response_data]),
            sorted([self.heap_boundary.name, self.heap_boundary2.name]),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test list heap endpoint without authentication.
    def test_list_heap_boundary_un_authenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(
            reverse("heap-boundary-list"), {"iteration_id": self.iteration.id}
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # Test get heap endpoint.
    def test_get_heap_boundary(self):
        # Act.
        response = self.client.get(
            reverse("heap-boundary-detail", kwargs={"pk": self.heap_boundary.id})
        )
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data["name"], self.heap_boundary.name)
        self.assertEqual(
            response_data["included_in_kpi"], self.heap_boundary.included_in_kpi
        )

    # Test update heap endpoint.
    def test_update_heap_boundary(self):
        data = {
            "name": "Updated Name",
        }
        response = self.client.patch(
            reverse("heap-boundary-detail", kwargs={"pk": self.heap_boundary.id}),
            data,
        )
        response_data = response.json()["data"]
        self.assertEqual(response_data["name"], data["name"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test delete heap endpoint.
    def test_delete_heap_boundary(self):
        response = self.client.delete(
            reverse("heap-boundary-detail", kwargs={"pk": self.heap_boundary.id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test recalculate volume endpoint.
    @mock.patch(
        "iteration_manager.views.heap_boundary_views.calculate_volume",
        return_value=mocked_volume_calculation(),
    )
    def test_recalculate_volume(self, mocked_output):
        # Act.
        response = self.client.post(
            reverse(
                "heap-boundary-recalculate-volume",
                kwargs={"pk": self.heap_boundary.id},
            )
        )

        # Assert.
        response_data = response.json()["data"]
        expected_volume = mocked_volume_calculation()[0]["cut_volume"]

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_data["name"], self.heap_boundary.name)
        self.assertEqual(float(response_data["cut_volume"]), expected_volume)

    def test_download_heap(self):
        # Act.
        response = self.client.get(
            reverse(
                "heap-boundary-download",
                kwargs={"pk": self.heap_boundary.id},
            )
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.content)

    # Download PDF.
    @mock.patch.object(
        AwsManager,
        "get_download_signed_url",
        return_value=MockedAwsManager.get_download_signed_url(),
    )
    def test_download_volume_pdf(self, mocked_output):
        # Arrange.
        params = {
            "ids": [str(self.heap_boundary2.id), str(self.heap_boundary2.id)],
            "response_format": VolumeReportFormat.PDF.value,
        }

        # Act.
        response = self.client.get(reverse("heap-boundary-volume-report"), data=params)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.content)
        self.assertEqual(response["Content-Type"], "application/pdf")

    # Download CSV.
    def test_download_volume_csv(self):
        # Arrange.
        params = {
            "ids": [str(self.heap_boundary2.id), str(self.heap_boundary2.id)],
            "response_format": VolumeReportFormat.CSV.value,
        }

        # Act.
        response = self.client.get(reverse("heap-boundary-volume-report"), data=params)

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.content)
        self.assertEqual(response["Content-Type"], "application/csv")
