import json
import uuid
from unittest import mock

from django.urls import reverse
from rest_framework import status

from project_manager.models import ProjectPermission
from shared.aws.aws_manager import AwsManager
from shared.tests import BaseTestCase, MockedAwsManager
from shared.tests.constants import WKTGeometry
from shared.tests.mock import create_test_image
from site_manager.constants import AccessType
from site_manager.models import SitePermission

from ..constants import FeatureType
from ..models import AccessTag, Feature


class TestFeatures(BaseTestCase):
    def setUp(self):
        self.feature1 = Feature.objects.create(
            name="Test Feature 1",
            geometry=WKTGeometry.POLYGON.value,
            layer=self.layer,
            info="some info",
        )

        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=True,
            can_manage_sites=True,
        )
        self.site_manage_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=True,
            can_manage_iterations_and_layers=True,
            access_type=AccessType.ADVANCE.value,
        )
        self.access_tag = AccessTag.objects.create(
            name="Access Tag 1", org=self.org, color="#ffffff"
        )
        self.user_group.access_tags.add(self.access_tag)
        self.layer.access_tags.add(self.access_tag)

        self.api_authentication(self.user)

    # Test list features endpoint.
    def test_list_features(self):
        response = self.client.get(
            reverse("features-list"),
            data={
                "layer_id": self.layer.id,
            },
        )
        response_data = response.json()["data"]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            sorted([item["name"] for item in response_data["features"]]),
            sorted([self.feature.name, self.feature1.name]),
        )

    # Test create feature endpoint.
    def test_create_feature(self):
        # Arrange.
        data = {
            "id": uuid.uuid4(),
            "name": "Feature 2",
            "geometry": WKTGeometry.POLYGON.value,
            "layer": self.layer.id,
            "type": FeatureType.POLYGON.value,
        }

        # Act.
        response = self.client.post(reverse("features-list"), data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response_data["name"], data["name"])
        self.assertEqual(response_data["type"], data["type"])

    # Test create feature for 3D WKT endpoint.
    def test_create_feature_with_3d_wkt(self):
        # Arrange.
        data = {
            "id": uuid.uuid4(),
            "name": "Feature 2",
            "geometry": "POLYGON Z ((74.08085859598526 24.61100185208857 0, 74.0808524033845 24.61083986567076 0, 74.08091340879027 24.61085031798181 0, 74.08085859598526 24.61100185208857 0))",
            "layer": self.layer.id,
            "type": FeatureType.POLYGON.value,
        }

        # Act.
        response = self.client.post(reverse("features-list"), data)
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response_data["name"], data["name"])
        self.assertEqual(response_data["type"], data["type"])

    # Test create feature for failure (no layer_id) endpoint.
    def test_create_feature_failure(self):
        data = {
            "name": "Feature 2",
            "geometry": WKTGeometry.POLYGON.value,
        }
        response = self.client.post(reverse("features-list"), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # Test update feature endpoint.
    def test_update_feature(self):
        data = {"name": "New Test Feature"}
        response = self.client.patch(
            reverse("features-detail", kwargs={"pk": self.feature.id}), data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if response.get("name"):
            self.assertEqual(response["name"], data["name"])

    # Test delete feature endpoint.
    def test_delete_feature(self):
        response = self.client.delete(
            reverse("features-detail", kwargs={"pk": self.feature.id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test bulk create feature endpoint.
    def test_bulk_create_feature(self):
        # Arrange.
        data = [
            {
                "id": str(uuid.uuid4()),
                "name": "test feature 1",
                "layer": str(self.layer.id),
                "geometry": WKTGeometry.POLYGON.value,
                "type": FeatureType.POLYGON.value,
            },
            {
                "id": str(uuid.uuid4()),
                "name": "test feature 2",
                "layer": str(self.layer.id),
                "geometry": WKTGeometry.POLYGON.value,
                "type": FeatureType.POLYGON.value,
            },
        ]

        # Act.
        response = self.client.post(
            reverse("features-bulk-action"),
            data=json.dumps(data),
            content_type="application/json",
        )
        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_data["features"]), 2)

    # Test update feature endpoint.
    def test_bulk_update_feature(self):
        feature_to_update = self.feature
        feature_to_update.name = "Updated Feature Name 1"
        feature_to_update2 = self.feature1
        feature_to_update2.name = "Updated Feature Name 2"

        data = [
            {
                "id": str(feature_to_update.id),
                "name": feature_to_update.name,
                "geometry": feature_to_update.geometry.wkt,
                "type": FeatureType.POLYGON.value,
            },
            {
                "id": str(feature_to_update2.id),
                "name": feature_to_update2.name,
                "geometry": feature_to_update2.geometry.wkt,
                "type": FeatureType.POLYGON.value,
            },
        ]

        response = self.client.patch(
            reverse("features-bulk-action"),
            data=json.dumps(data),
            content_type="application/json",
        )
        updated_feature = Feature.objects.get(id=feature_to_update.id)
        updated_feature2 = Feature.objects.get(id=feature_to_update2.id)

        self.assertEqual(feature_to_update, updated_feature)
        self.assertEqual(feature_to_update2, updated_feature2)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Test bulk feature delete.
    def test_bulk_delete_feature(self):
        # Act.
        response = self.client.delete(
            reverse("features-bulk-action")
            + f"?ids={self.feature.id},{self.feature1.id}"
        )
        response_meta = response.json()["meta"]

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_meta["message"], "2 features deleted successfully.")

    @mock.patch.object(
        AwsManager,
        "upload_file",
        return_value=MockedAwsManager.upload_file(),
    )
    @mock.patch.object(
        AwsManager,
        "get_download_signed_url",
        return_value=MockedAwsManager.get_download_signed_url(),
    )
    def test_update_feature_info_case1(self, *mock_output):
        """
        When feature id is valid.
        """

        # Arrange.
        data = {
            "image_list": [create_test_image()],
            "info": "some info",
        }

        # Act.
        response = self.client.patch(
            reverse("features-feature-info", kwargs={"pk": self.feature.id}),
            data,
        )

        response_data = response.json()["data"]

        # Assert.
        self.assertEqual(response_data["info"], self.feature.info)
        self.assertIsNotNone(response_data["images"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_feature_info_case2(self):
        """
        When feature id is invalid.
        """

        # Arrange.
        data = {
            "image_list": [create_test_image()],
            "info": "some info",
        }

        # Act.
        response = self.client.patch(
            reverse("features-feature-info", kwargs={"pk": uuid.uuid4()}),
            data,
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_feature_info_case1(self):
        """
        When image id is valid.
        """

        # Act.
        response = self.client.delete(
            reverse(
                "features-delete-feature-image", kwargs={"id": self.feature_image.id}
            )
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_feature_info_case2(self):
        """
        When image id is invalid.
        """

        # Act.
        response = self.client.delete(
            reverse("features-delete-feature-image", kwargs={"id": uuid.uuid4()})
        )

        # Assert.
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
