import fakeredis
from django.urls import reverse

from processing_workflow_manager.constants import ProcessingStatus
from processing_workflow_manager.tests import ProcessingBaseTestCase
from processing_workflow_manager.tests.test_utils.task_utils import (
    get_task_batch_job_env_variables,
)
from project_manager.models import ProjectPermission
from rainbow.env_variables import EnvVariable
from shared.aws import AwsManager
from shared.constants import BatchJobStatus
from shared.tests import mock
from shared.tests.mock import MockedAwsManager
from site_manager.models import SitePermission

from ..views import general_views, task_views


class TaskTestCaseForOrgAdmin(ProcessingBaseTestCase):
    def setUp(self):
        self.api_authentication(self.org_admin)

    def test_fetch_task_details(self):
        response = self.client.get(
            reverse(
                "tasks-detail",
                kwargs={"pk": self.task_pending_iteration_dataset_wgs84_2.id},
            )
        )
        response_json = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response_json["meta"]["message"], "task_details_fetched_successfully."
        )

    @mock.patch.object(
        AwsManager,
        "terminate_batch_job",
        return_value=MockedAwsManager.terminate_batch_job(),
    )
    @mock.patch.object(task_views, "slack_notification_handler", return_value=True)
    @mock.patch("redis.Redis", return_value=fakeredis.FakeRedis())
    def test_success_task_cancellation(self, *mocked_output):
        response = self.client.patch(
            reverse(
                "tasks-cancel-task",
                kwargs={"pk": self.task_pending_iteration_dataset_wgs84_2.pk},
            )
        )
        self.assertEqual(response.status_code, 200)

    @mock.patch.object(
        AwsManager,
        "terminate_batch_job",
        return_value=MockedAwsManager.terminate_batch_job(),
    )
    @mock.patch.object(task_views, "slack_notification_handler", return_value=True)
    @mock.patch("redis.Redis", return_value=fakeredis.FakeRedis())
    def test_failure_task_cancellation(self, *mocked_output):
        response = self.client.patch(
            reverse(
                "tasks-cancel-task",
                kwargs={"pk": self.task_iteration_dataset_wgs84_1.pk},
            )
        )
        response_json = response.json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response_json["meta"]["slug"], "invalid_status_transition")

    @mock.patch.object(task_views, "slack_notification_handler", return_value=True)
    @mock.patch("redis.Redis", return_value=fakeredis.FakeRedis())
    def test_success_task_status_update_from_pending_to_processing(
        self, *mocked_output
    ):
        data = {
            "status": ProcessingStatus.PROCESSING.value,
            "API_KEY": EnvVariable.MCLI_API_KEY.value,
        }
        response = self.client.patch(
            reverse(
                "tasks-status",
                kwargs={"pk": self.task_pending_iteration_dataset_wgs84_2.pk},
            ),
            data,
        )
        self.assertEqual(response.status_code, 200)
        self.task_pending_iteration_dataset_wgs84_2.refresh_from_db()
        self.assertEqual(
            self.task_pending_iteration_dataset_wgs84_2.status,
            ProcessingStatus.PROCESSING.value,
        )

    @mock.patch.object(task_views, "slack_notification_handler", return_value=True)
    @mock.patch("redis.Redis", return_value=fakeredis.FakeRedis())
    def test_success_task_status_update_from_pending_to_error(self, *mocked_output):
        data = {
            "status": ProcessingStatus.ERROR.value,
            "API_KEY": EnvVariable.MCLI_API_KEY.value,
        }
        response = self.client.patch(
            reverse(
                "tasks-status",
                kwargs={"pk": self.task_pending_iteration_dataset_wgs84_2.pk},
            ),
            data,
        )
        self.assertEqual(response.status_code, 200)
        self.task_pending_iteration_dataset_wgs84_2.refresh_from_db()
        self.assertEqual(
            self.task_pending_iteration_dataset_wgs84_2.status,
            ProcessingStatus.ERROR.value,
        )

    @mock.patch.object(task_views, "slack_notification_handler", return_value=True)
    @mock.patch("redis.Redis", return_value=fakeredis.FakeRedis())
    def test_failure_task_status_update_from_pending_to_completed(self, *mocked_output):
        data = {
            "status": ProcessingStatus.COMPLETED.value,
            "API_KEY": EnvVariable.MCLI_API_KEY.value,
        }
        response = self.client.patch(
            reverse(
                "tasks-status",
                kwargs={"pk": self.task_pending_iteration_dataset_wgs84_2.pk},
            ),
            data,
        )
        response_json = response.json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response_json["meta"]["details"]["status"][0]["slug"],
            "invalid_status_transition",
        )
        self.task_pending_iteration_dataset_wgs84_2.refresh_from_db()
        self.assertEqual(
            self.task_pending_iteration_dataset_wgs84_2.status,
            ProcessingStatus.PENDING.value,
        )

    def test_failure_task_status_update_without_api_key(self):
        data = {"status": ProcessingStatus.COMPLETED.value}
        response = self.client.patch(
            reverse(
                "tasks-status",
                kwargs={"pk": self.task_pending_iteration_dataset_wgs84_2.pk},
            ),
            data,
        )
        response.json()
        self.assertEqual(response.status_code, 403)

    @mock.patch.object(general_views, "slack_notification_handler", return_value=True)
    @mock.patch("redis.Redis", return_value=fakeredis.FakeRedis())
    def test_failed_processing_task_status(self, *mocked_output):
        self.task_pending_iteration_dataset_wgs84_2.status = (
            ProcessingStatus.PROCESSING.value
        )
        self.task_pending_iteration_dataset_wgs84_2.save()
        task_env_variables = get_task_batch_job_env_variables(
            self.task_pending_iteration_dataset_wgs84_2.id
        )
        data = {
            "API_KEY": EnvVariable.MCLI_API_KEY.value,
            "environment": task_env_variables["environment"],
        }
        response = self.client.patch(
            reverse("failed_status_update"), data, format="json"
        )
        response_json = response.json()
        self.task_pending_iteration_dataset_wgs84_2.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            self.task_pending_iteration_dataset_wgs84_2.status,
            ProcessingStatus.ERROR.value,
        )
        self.assertEqual(
            response_json["meta"]["message"],
            "failed_status_updated_successfully.",
        )
        self.task_pending_iteration_dataset_wgs84_2.refresh_from_db()
        self.assertEqual(
            self.task_pending_iteration_dataset_wgs84_2.status,
            ProcessingStatus.ERROR.value,
        )
        self.assertEqual(
            self.task_pending_iteration_dataset_wgs84_2.batch_job_details.status,
            BatchJobStatus.FAILED.value,
        )

    @mock.patch.object(
        AwsManager,
        "get_download_signed_url",
        return_value=MockedAwsManager.get_download_signed_url(),
    )
    def test_task_output_download(self, mocked_output):
        params = {"download_type": "project_file"}
        response = self.client.get(
            reverse(
                "tasks-download", kwargs={"pk": self.task_iteration_dataset_wgs84_1.id}
            ),
            data=params,
        )
        response_json = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_json["data"], "download_url")
        self.assertEqual(
            response_json["meta"]["message"],
            "presigned_url_for_task_output_fetched_successfully",
        )

    def test_task_output_download_for_pending_task(self):
        params = {"download_type": "project_file"}
        response = self.client.get(
            reverse(
                "tasks-download",
                kwargs={"pk": self.task_pending_iteration_dataset_wgs84_2.id},
            ),
            data=params,
        )
        response_json = response.json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response_json["meta"]["message"], "task_is_not_completed")


class TaskTestCaseForMember(ProcessingBaseTestCase):
    # Test for member user.
    def setUp(self):
        self.project_permission = ProjectPermission.objects.create(
            project=self.project,
            user_group=self.user_group_with_manage_iteration,
            can_view=True,
            can_manage_sites=False,
        )
        self.site_permission = SitePermission.objects.create(
            project=self.project,
            site=self.site,
            user_group=self.user_group_with_manage_iteration,
            can_view=True,
            can_manage_iterations_and_layers=True,
        )
        self.api_authentication(self.user_2)

    @mock.patch.object(
        AwsManager,
        "terminate_batch_job",
        return_value=MockedAwsManager.terminate_batch_job(),
    )
    @mock.patch.object(task_views, "slack_notification_handler", return_value=True)
    @mock.patch("redis.Redis", return_value=fakeredis.FakeRedis())
    def test_success_task_cancellation_for_member_with_permission(self, *mocked_output):
        response = self.client.patch(
            reverse(
                "tasks-cancel-task",
                kwargs={"pk": self.task_pending_iteration_dataset_wgs84_2.pk},
            )
        )
        self.assertEqual(response.status_code, 200)

    def test_fetch_task_details_for_member_with_permission(self):
        response = self.client.get(
            reverse(
                "tasks-detail",
                kwargs={"pk": self.task_pending_iteration_dataset_wgs84_2.id},
            )
        )
        response_json = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response_json["meta"]["message"], "task_details_fetched_successfully."
        )

    def test_task_cancellation_without_permission(self):
        self.api_authentication(self.user_of_org2)
        response = self.client.patch(
            reverse(
                "tasks-cancel-task",
                kwargs={"pk": self.task_pending_iteration_dataset_wgs84_2.pk},
            )
        )
        self.assertEqual(response.status_code, 403)

    def test_fetch_task_details_for_member_without_permission(self):
        self.api_authentication(self.user_of_org2)
        response = self.client.get(
            reverse(
                "tasks-detail",
                kwargs={"pk": self.task_pending_iteration_dataset_wgs84_2.id},
            )
        )
        self.assertEqual(response.status_code, 403)

    @mock.patch.object(
        AwsManager,
        "get_download_signed_url",
        return_value=MockedAwsManager.get_download_signed_url(),
    )
    def test_task_output_download_for_member_with_permission(self, mocked_output):
        params = {"download_type": "project_file"}
        response = self.client.get(
            reverse(
                "tasks-download", kwargs={"pk": self.task_iteration_dataset_wgs84_1.id}
            ),
            data=params,
        )
        response_json = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_json["data"], "download_url")
        self.assertEqual(
            response_json["meta"]["message"],
            "presigned_url_for_task_output_fetched_successfully",
        )

    def test_task_output_download_for_member_without_permission(self):
        self.api_authentication(self.user_of_org2)
        params = {"download_type": "project_file"}
        response = self.client.get(
            reverse(
                "tasks-download", kwargs={"pk": self.task_iteration_dataset_wgs84_1.id}
            ),
            data=params,
        )
        self.assertEqual(response.status_code, 403)

    def test_task_cancellation_without_feature_flag_enabled(self):
        self.api_authentication(self.user_of_org2)
        response = self.client.patch(
            reverse(
                "tasks-cancel-task",
                kwargs={"pk": self.task_pending_iteration_dataset_wgs84_2.pk},
            )
        )
        self.assertEqual(response.status_code, 403)

    def test_fetch_task_details_for_member_without_feature_flag_enabled(self):
        self.api_authentication(self.user_of_org2)

        response = self.client.get(
            reverse(
                "tasks-detail",
                kwargs={"pk": self.task_pending_iteration_dataset_wgs84_2.id},
            )
        )
        self.assertEqual(response.status_code, 403)

    @mock.patch("redis.Redis", return_value=fakeredis.FakeRedis())
    @mock.patch.object(task_views, "slack_notification_handler", return_value=True)
    def test_task_status_update_without_feature_flag(self, *mocked_output):
        self.api_authentication(self.user_of_org2)
        data = {"status": ProcessingStatus.COMPLETED.value}
        response = self.client.patch(
            reverse(
                "tasks-status",
                kwargs={"pk": self.task_pending_iteration_dataset_wgs84_2.pk},
            ),
            data,
        )
        self.assertEqual(response.status_code, 403)

    def test_task_output_download_without_feature_flag(self):
        self.api_authentication(self.user_of_org2)
        params = {"download_type": "project_file"}
        response = self.client.get(
            reverse(
                "tasks-download", kwargs={"pk": self.task_iteration_dataset_wgs84_1.id}
            ),
            data=params,
        )
        self.assertEqual(response.status_code, 403)
