from django.urls import reverse

from project_manager.models import ProjectPermission
from shared.aws import AwsManager
from shared.tests import mock
from shared.tests.mock import mock_generator
from site_manager.models.site_models import SitePermission

from ..constants import FileUploadStatus
from ..models import GeotagImage
from ..views import upload_images_views
from .base_test_case import ProcessingBaseTestCase


class IterationUploadImagesTestCase(ProcessingBaseTestCase):
    def setUp(self):
        # Permissions.
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group,
            can_view=True,
            can_manage_sites=False,
        )
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group,
            can_view=True,
            can_manage_iterations_and_layers=True,
        )
        self.api_authentication(self.user)

    def test_get_uploaded_image_lists_for_iteration(self):
        response = self.client.get(
            reverse(
                "iteration-dataset-uploaded-images-list",
                kwargs={"pk": str(self.iteration_dataset_wgs84.id)},
            ),
        )

        self.assertEqual(response.status_code, 200)
        filenames = response.json()["data"]["filenames"]
        self.assertEqual(len(filenames), 4)

    @mock.patch.object(AwsManager, "put_object_presigned_url", return_value="dummy_url")
    def test_get_image_file_upload_presigned_url(self, mocked_output):
        file_presigned_urls = [
            "DSC00031.JPG",
            "DSC00032.JPG",
            "DSC00033.JPG",
        ]
        response = self.client.post(
            reverse(
                "iteration-dataset-images-presigned-url",
                kwargs={"pk": self.iteration_dataset_wgs84.id},
            ),
            data={"filenames": file_presigned_urls},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        file_presigned_urls = response.json()["data"]["presigned_urls"]
        self.assertEqual(len(file_presigned_urls), 3)

    @mock.patch.object(AwsManager, "put_object_presigned_url", return_value="dummy_url")
    def test_image_file_upload_presigned_url_error_for_unknown_file_type(
        self, mocked_output
    ):
        file_presigned_urls = [
            "DSC00031.JPG",
            "DSC00032.JPG",
            "DSC00033.PDF",
        ]
        response = self.client.post(
            reverse(
                "iteration-dataset-images-presigned-url",
                kwargs={"pk": self.iteration_dataset_wgs84.id},
            ),
            data={"filenames": file_presigned_urls},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        error_message_slug = response.json()["meta"]["slug"]
        self.assertEqual(error_message_slug, "invalid_file_type_provided")

    @mock.patch.object(AwsManager, "put_object_presigned_url", return_value="dummy_url")
    def test_image_file_upload_presigned_url_error_image_folder_path(
        self, mocked_output
    ):
        self.iteration_dataset_wgs84.image_folder_path = None
        self.iteration_dataset_wgs84.save()
        file_presigned_urls = [
            "DSC00031.JPG",
            "DSC00032.JPG",
            "DSC00033.JPG",
        ]
        response = self.client.post(
            reverse(
                "iteration-dataset-images-presigned-url",
                kwargs={"pk": self.iteration_dataset_wgs84.id},
            ),
            data={"filenames": file_presigned_urls},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        error_message_slug = response.json()["meta"]["slug"]
        self.assertEqual(error_message_slug, "iteration_image_folder_does_not_exists")

    @mock.patch.object(AwsManager, "does_file_exist", return_value=True)
    def test_image_upload_success_url(self, *mocked_output):
        response = self.client.post(
            reverse(
                "iteration-dataset-image-upload-success",
                kwargs={"pk": str(self.iteration_dataset_wgs84.id)},
            ),
            data={"image_filename": "DSC000123.JPG"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        geotag_image = GeotagImage.objects.filter(filename="DSC000123.JPG").first()
        self.assertIsNotNone(geotag_image)

    @mock.patch.object(AwsManager, "does_file_exist", return_value=False)
    def test_image_upload_success_url_file_not_uploaded(self, *mocked_output):
        response = self.client.post(
            reverse(
                "iteration-dataset-image-upload-success",
                kwargs={"pk": str(self.iteration_dataset_wgs84.id)},
            ),
            data={"image_filename": "DSC000123.JPG"},
            format="json",
        )
        self.assertEqual(response.status_code, 404)
        error_message_slug = response.json()["meta"]["slug"]
        self.assertEqual(error_message_slug, "image_file_does_not_exists_in_S3")

    @mock.patch.object(
        AwsManager, "get_objects_in_s3_folder", return_value=mock_generator()
    )
    @mock.patch.object(
        upload_images_views,
        "check_image_exif",
        return_value=False,
    )
    def test_complete_upload_geotag_images_done(self, *args, **kwargs):
        response = self.client.post(
            reverse(
                "iteration-dataset-images-upload-complete",
                kwargs={"pk": str(self.iteration_dataset_wgs84.id)},
            ),
            data={"upload_status": FileUploadStatus.DONE.value},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        response_message = response.json()["meta"]["message"]
        self.assertEqual(response_message, "geotag_images_upload_complete")

    @mock.patch.object(
        AwsManager, "get_objects_in_s3_folder", return_value=mock_generator()
    )
    @mock.patch.object(
        upload_images_views,
        "check_image_exif",
        return_value=True,
    )
    @mock.patch.object(
        upload_images_views,
        "submit_exif_extractor_job",
    )
    def test_complete_upload_for_all_geotag_images_exif_extractor(
        self, submit_exif_extractor_job, *args, **kwargs
    ):
        submit_exif_extractor_job.return_value = self.sample_batch_job

        response = self.client.post(
            reverse(
                "iteration-dataset-images-upload-complete",
                kwargs={"pk": str(self.iteration_dataset_utm_zone.id)},
            ),
            data={"upload_status": FileUploadStatus.DONE.value},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.iteration_dataset_utm_zone.refresh_from_db()
        self.assertTrue(self.iteration_dataset_utm_zone.is_preparing_geotags)

    @mock.patch.object(
        AwsManager, "get_objects_in_s3_folder", return_value=mock_generator()
    )
    @mock.patch.object(
        upload_images_views,
        "check_image_exif",
        return_value=False,
    )
    def test_complete_upload_geotag_images_failed(self, *args, **kwargs):
        response = self.client.post(
            reverse(
                "iteration-dataset-images-upload-complete",
                kwargs={"pk": str(self.iteration_dataset_wgs84.id)},
            ),
            data={"upload_status": FileUploadStatus.FAILED.value},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        response_message = response.json()["meta"]["slug"]
        self.assertEqual(response_message, "file_upload_failed")
