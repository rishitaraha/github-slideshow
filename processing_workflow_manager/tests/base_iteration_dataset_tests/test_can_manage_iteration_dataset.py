from unittest import SkipTest, mock

from django.urls import reverse
from rest_framework import status

from processing_workflow_manager.tests.test_utils.iteration_dataset_download_utils import (
    mock_get_objects_in_s3_folder,
)
from shared.constants import EPSG, VerticalCRS

from ..base_test_case import ProcessingBaseTestCase


class TestCanManageIterationDataset(ProcessingBaseTestCase):
    def setUp(self):
        raise SkipTest("Helper test")

    def test_iteration_dataset_creation(self):
        data = {"iteration": self.iteration_without_iteration_dataset.id}
        response = self.client.post(reverse("iteration-dataset-list"), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_iteration_dataset_creation_when_created_already(self):
        data = {"iteration": self.iteration.id}
        response = self.client.post(reverse("iteration-dataset-list"), data)
        self.assertEqual(response.status_code, status.HTTP_208_ALREADY_REPORTED)

    def test_iteration_dataset_creation_when_iteration_does_not_exist(self):
        data = {"iteration": self.layer.id}
        response = self.client.post(reverse("iteration-dataset-list"), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_iteration_dataset_fetch(self):
        response = self.client.get(
            reverse(
                "iteration-dataset-detail",
                kwargs={"pk": str(self.iteration_dataset_wgs84.id)},
            )
        )
        response_json = response.json()
        tasks = response_json["data"]["tasks"]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(tasks), 2)
        self.assertEqual(
            tasks[1]["output_ortho_s3_object_key"],
            self.task_iteration_dataset_wgs84_1.output_ortho.s3_key,
        )

    def test_iteration_dataset_update_gcp_crs(self):
        data = {
            "gcp_vertical_crs": VerticalCRS.EGM96.value,
            "gcp_horizontal_crs": EPSG.WGS84_UTM_ZONE_42.value,
        }
        response = self.client.patch(
            reverse(
                "iteration-dataset-detail",
                kwargs={"pk": self.iteration_dataset_wgs84.pk},
            ),
            data,
            format="json",
        )

        response_json_data = response.json()["data"]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response_json_data["iteration_dataset"]["gcp_vertical_crs"],
            VerticalCRS.EGM96.value,
        )
        self.assertEqual(
            response_json_data["iteration_dataset"]["gcp_horizontal_crs"], 32642
        )

    def test_iteration_dataset_update_geotag_image_crs(self):
        data = {
            "geotag_horizontal_crs": EPSG.WGS84.value,
            "geotag_vertical_crs": VerticalCRS.ELLIPSOIDAL.value,
        }
        response = self.client.patch(
            reverse(
                "iteration-dataset-detail",
                kwargs={"pk": self.iteration_dataset_wgs84.pk},
            ),
            data,
            format="json",
        )

        response_json_data = response.json()["data"]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response_json_data["iteration_dataset"]["geotag_horizontal_crs"],
            EPSG.WGS84.value,
        )
        self.assertEqual(
            response_json_data["iteration_dataset"]["geotag_vertical_crs"],
            VerticalCRS.ELLIPSOIDAL.value,
        )

    @mock.patch(
        "shared.aws.aws_manager.AwsManager.get_objects_in_s3_folder",
        return_value=mock_get_objects_in_s3_folder(),
    )
    def test_iteration_dataset_input_data_download(self, mocked_data):
        # get signed token
        get_signed_token = self.client.get(
            reverse(
                "iteration-dataset-signed-token",
                kwargs={"pk": self.iteration_dataset_wgs84.pk},
            )
        )
        self.assertEqual(get_signed_token.status_code, 200)

        # use signed token to download input data
        data = {"signed_token": get_signed_token.json()["data"]["signed_token"]}
        response = self.client.get(
            reverse(
                "iteration-dataset-input-data",
                kwargs={"pk": self.iteration_dataset_wgs84.pk},
            ),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.streaming_content)
