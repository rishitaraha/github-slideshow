import os

from django.core.files import File
from django.urls import reverse

from processing_workflow_manager.constants.gcp_geotag_constants import GCPType
from project_manager.models import ProjectPermission
from shared.constants.gis import EPSG, VerticalCRS
from site_manager.models.site_models import SitePermission

from ..constants import GCPFileUploadAction
from ..tests import ProcessingBaseTestCase


class GCPTestCaseForOrgAdmin(ProcessingBaseTestCase):
    def setUp(self):
        self.api_authentication(self.org_admin)

    def test_gcp_list_for_iteration_dataset(self):
        response = self.client.get(
            reverse("gcps-list"),
            data={
                "iteration_dataset": str(self.iteration_dataset_wgs84.id),
                "page_number": 0,
                "page_size": 5,
            },
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()["data"]
        self.assertEqual(response_data["total"], 5)

    def test_gcp_list_with_search_query(self):
        search_label = "GCP1"
        response = self.client.get(
            reverse("gcps-list"),
            data={
                "iteration_dataset": str(self.iteration_dataset_wgs84.id),
                "search": search_label,
            },
        )
        self.assertEqual(response.status_code, 200)

        response_gcp_list = response.json()["data"]["gcps"]
        self.assertEqual(response_gcp_list[0]["label"], search_label)
        self.assertEqual(response_gcp_list[0]["number_of_images_tagged"], 0)

    def test_gcp_list_without_gcps(self):
        self.gcp_utm_1.delete()
        response = self.client.get(
            reverse("gcps-list"),
            data={"iteration_dataset": str(self.iteration_dataset_utm_zone.id)},
        )
        response_data = response.json()["data"]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_data["total"], 0)

    def test_iteration_dataset_gcp_file_download(self):
        data = {
            "iteration_dataset": self.iteration_dataset_wgs84.id,
        }
        response = self.client.get(reverse("gcps-download"), data=data)
        self.assertEqual(response.status_code, 200)
        self.assertEquals(
            response.get("Content-Disposition"), "attachment; filename=gcp.txt"
        )

    def test_iteration_dataset_with_no_gcps_file_download(self):
        self.iteration_dataset_wgs84.are_gcps_present = False
        self.iteration_dataset_wgs84.save()
        data = {
            "iteration_dataset": self.iteration_dataset_wgs84.id,
        }
        response = self.client.get(reverse("gcps-download"), data=data)
        response_data = response.json()["data"]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_data["total"], 0)

    def test_update_gcp_wgs84_info(self):
        updated_name = "GCP updated name"
        data = {
            "gcp": {
                "label": updated_name,
                "type": GCPType.CONTROLPOINT.value,
                "x_coordinate": "24.0333",
                "y_coordinate": "85.76",
                "z_coordinate": "300",
            }
        }
        response = self.client.patch(
            reverse("gcps-detail", kwargs={"pk": self.gcp_wgs84_1.id}),
            data,
            format="json",
        )
        response_gcp = response.json()["data"]["gcp"]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_gcp["label"], updated_name)
        self.assertEqual(response_gcp["x_coordinate"], 24.0333)
        self.assertEqual(response_gcp["y_coordinate"], 85.76)
        self.assertEqual(response_gcp["z_coordinate"], 300)

    def test_update_gcp_wgs84_info_with_invalid_coordinates(self):
        updated_name = "GCP updated name"
        data = {
            "gcp": {
                "label": updated_name,
                "type": GCPType.CONTROLPOINT.value,
                "x_coordinate": "200",
                "y_coordinate": "150",
                "z_coordinate": "300",
            }
        }
        response = self.client.patch(
            reverse("gcps-detail", kwargs={"pk": self.gcp_wgs84_1.id}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        response_meta = response.json()["meta"]
        self.assertEqual(response_meta["slug"], "coordinates_out_of_bounds")

    def test_update_gcp_utm_zone_info(self):
        updated_name = "GCP UTM updated name"
        data = {
            "gcp": {
                "label": updated_name,
                "type": GCPType.CONTROLPOINT.value,
                "x_coordinate": "23806.7",
                "y_coordinate": "4443.56",
                "z_coordinate": "300",
            }
        }
        response = self.client.patch(
            reverse("gcps-detail", kwargs={"pk": self.gcp_utm_1.id}),
            data,
            format="json",
        )
        response_gcp = response.json()["data"]["gcp"]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_gcp["label"], updated_name)
        self.assertEqual(response_gcp["x_coordinate"], 23806.7)
        self.assertEqual(response_gcp["y_coordinate"], 4443.56)
        self.assertEqual(response_gcp["z_coordinate"], 300)

    def test_update_gcp_utm_zone_info_with_invalid_coordinates(self):
        updated_name = "GCP UTM updated name"
        data = {
            "gcp": {
                "label": updated_name,
                "type": GCPType.CONTROLPOINT.value,
                "x_coordinate": "2380600.7",
                "y_coordinate": "444350.56",
                "z_coordinate": "300",
            }
        }
        response = self.client.patch(
            reverse("gcps-detail", kwargs={"pk": self.gcp_utm_1.id}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        response_meta = response.json()["meta"]
        self.assertEqual(response_meta["slug"], "coordinates_out_of_bounds")

    def test_gcp_create(self):
        gcp_file = File(
            open(
                f"{os.getcwd()}/processing_workflow_manager/tests/test_data/gcp_data.csv",
                "r",
            )
        )
        response = self.client.post(
            reverse("gcps-list"),
            data={
                "gcp_file": gcp_file,
                "iteration_dataset": str(self.iteration_dataset_wgs84.id),
                "gcp_horizontal_crs": EPSG.WGS84.value,
                "gcp_vertical_crs": VerticalCRS.ELLIPSOIDAL.value,
                "action": GCPFileUploadAction.REPLACE.value,
            },
            format="multipart",
        )
        response.json()["data"]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            self.iteration_dataset_wgs84.gcp_horizontal_crs.srid,
            EPSG.WGS84.value,
        )
        self.assertEqual(
            self.iteration_dataset_wgs84.gcp_vertical_crs,
            VerticalCRS.ELLIPSOIDAL.value,
        )

    def test_bulk_delete_few_gcps_of_iteration_dataset(self):
        response = self.client.post(
            reverse("gcps-bulk_delete"),
            data={
                "gcp_ids": [str(self.gcp_wgs84_1.id), str(self.gcp_wgs84_2.id)],
                "iteration_dataset": str(self.iteration_dataset_wgs84.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 204)

        self.iteration_dataset_wgs84.refresh_from_db()
        self.assertEqual(self.iteration_dataset_wgs84.gcps.count(), 3)
        self.assertEqual(self.iteration_dataset_wgs84.are_gcps_present, True)

    def test_bulk_delete_all_gcps_of_iteration_dataset(self):
        all_gcps = self.iteration_dataset_wgs84.gcps.all()
        all_gcp_ids = all_gcps.values_list("id", flat=True)

        response = self.client.post(
            reverse("gcps-bulk_delete"),
            data={
                "gcp_ids": all_gcp_ids,
                "iteration_dataset": str(self.iteration_dataset_wgs84.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 204)

        self.iteration_dataset_wgs84.refresh_from_db()
        self.assertEqual(self.iteration_dataset_wgs84.gcps.count(), 0)
        self.assertEqual(self.iteration_dataset_wgs84.are_gcps_present, False)

    def test_bulk_update_gcps(self):
        data = {
            "iteration_dataset": self.iteration_dataset_wgs84.id,
            "gcp_ids": [
                self.gcp_wgs84_1.id,
                self.gcp_wgs84_2.id,
            ],
            "type": "checkpoint",
        }
        response = self.client.patch(reverse("gcps-bulk-update"), data=data)
        self.assertEqual(response.status_code, 200)
        response_data = response.json()["data"]
        self.assertEqual(response_data["total"], 2)

    def test_bulk_update_gcps_invalid_uuid(self):
        data = {
            "iteration_dataset": self.iteration_dataset_wgs84.id,
            "gcp_ids": [
                self.gcp_utm_1.id,
            ],
            "type": "checkpoint",
        }
        response = self.client.patch(reverse("gcps-bulk-update"), data=data)
        self.assertEqual(response.status_code, 400)


class GCPTestCaseForMember(ProcessingBaseTestCase):
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

    def test_gcp_list_for_member_user_with_permissions(self):
        response = self.client.get(
            reverse("gcps-list"),
            data={"iteration_dataset": str(self.iteration_dataset_wgs84.id)},
        )
        self.assertEqual(response.status_code, 200)

    def test_gcp_list_for_member_user_without_permissions(self):
        self.api_authentication(self.user)
        response = self.client.get(
            reverse("gcps-list"),
            data={"iteration_dataset": str(self.iteration_dataset_wgs84.id)},
        )
        self.assertEqual(response.status_code, 403)

    def test_gcp_list_for_member_user_without_feature_flag(self):
        # Test for member user without feature flag for org.
        self.api_authentication(self.user_of_org2)
        response = self.client.get(
            reverse("gcps-list"),
            data={"iteration_dataset": str(self.iteration_dataset_wgs84.id)},
        )
        self.assertEqual(response.status_code, 403)

    def test_iteration_dataset_gcp_file_download_for_member_user_with_permission(
        self,
    ):
        data = {
            "iteration_dataset": self.iteration_dataset_wgs84.id,
        }
        response = self.client.get(reverse("gcps-download"), data=data)
        self.assertEqual(response.status_code, 200)
        self.assertEquals(
            response.get("Content-Disposition"), "attachment; filename=gcp.txt"
        )

    def test_iteration_dataset_gcp_file_download_for_member_user_without_permission(
        self,
    ):
        self.api_authentication(self.user)
        data = {
            "iteration_dataset": self.iteration_dataset_wgs84.id,
        }
        response = self.client.get(reverse("gcps-download"), data=data)
        self.assertEqual(response.status_code, 403)

    def test_iteration_dataset_gcp_file_download_for_member_user_without_feature_flag(
        self,
    ):
        self.api_authentication(self.user_of_org2)
        data = {
            "iteration_dataset": self.iteration_dataset_wgs84.id,
        }
        response = self.client.get(reverse("gcps-download"), data=data)
        self.assertEqual(response.status_code, 403)

    def test_iteration_dataset_gcp_info_update_for_member_user_without_feature_flag(
        self,
    ):
        self.api_authentication(self.user_of_org2)
        updated_name = "GCP UTM updated name"
        data = {
            "gcp": {
                "label": updated_name,
                "type": GCPType.CONTROLPOINT.value,
                "x_coordinate": "2380.7",
                "y_coordinate": "444.56",
                "z_coordinate": "300",
            }
        }
        response = self.client.patch(
            reverse("gcps-detail", kwargs={"pk": self.gcp_utm_1.id}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_iteration_dataset_gcp_info_update_for_member_user_without_permission(
        self,
    ):
        self.api_authentication(self.user)
        updated_name = "GCP UTM updated name"
        data = {
            "gcp": {
                "label": updated_name,
                "type": GCPType.CONTROLPOINT.value,
                "x_coordinate": "2380.7",
                "y_coordinate": "444.56",
                "z_coordinate": "300",
            }
        }
        response = self.client.patch(
            reverse("gcps-detail", kwargs={"pk": self.gcp_utm_1.id}),
            data,
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_gcp_create_for_member_user_without_feature_flag(self):
        self.api_authentication(self.user_of_org2)
        gcp_file = File(
            open(
                f"{os.getcwd()}/processing_workflow_manager/tests/test_data/gcp_data.csv",
                "r",
            )
        )
        response = self.client.post(
            reverse("gcps-list"),
            data={
                "gcp_file": gcp_file,
                "iteration_dataset": str(self.iteration_dataset_wgs84.id),
                "gcp_horizontal_crs": EPSG.WGS84.value,
                "gcp_vertical_crs": VerticalCRS.ELLIPSOIDAL.value,
                "action": GCPFileUploadAction.REPLACE.value,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 403)

    def test_gcp_create_for_member_user_with_permissions(self):
        gcp_file = File(
            open(
                f"{os.getcwd()}/processing_workflow_manager/tests/test_data/gcp_data.csv",
                "r",
            )
        )
        response = self.client.post(
            reverse("gcps-list"),
            data={
                "gcp_file": gcp_file,
                "iteration_dataset": str(self.iteration_dataset_wgs84.id),
                "gcp_horizontal_crs": EPSG.WGS84.value,
                "gcp_vertical_crs": VerticalCRS.ELLIPSOIDAL.value,
                "action": GCPFileUploadAction.REPLACE.value,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)

    def test_bulk_update_gcps_for_member_user_with_permissions(self):
        data = {
            "iteration_dataset": self.iteration_dataset_wgs84.id,
            "gcp_ids": [
                self.gcp_wgs84_1.id,
                self.gcp_wgs84_2.id,
            ],
            "type": "checkpoint",
        }
        response = self.client.patch(reverse("gcps-bulk-update"), data=data)
        self.assertEqual(response.status_code, 200)

    def test_bulk_update_gcps_for_member_user_without_permissions(self):
        self.api_authentication(self.user)
        data = {
            "iteration_dataset": self.iteration_dataset_wgs84.id,
            "gcp_ids": [
                self.gcp_wgs84_1.id,
                self.gcp_wgs84_2.id,
            ],
            "type": "checkpoint",
        }
        response = self.client.patch(reverse("gcps-bulk-update"), data=data)
        self.assertEqual(response.status_code, 403)

    def test_bulk_update_gcps_for_member_user_without_feature_flag(self):
        self.api_authentication(self.user_of_org2)
        data = {
            "iteration_dataset": self.iteration_dataset_wgs84.id,
            "gcp_ids": [
                self.gcp_wgs84_1.id,
                self.gcp_wgs84_2.id,
            ],
            "type": "checkpoint",
        }
        response = self.client.patch(reverse("gcps-bulk-update"), data=data)
        self.assertEqual(response.status_code, 403)

    def test_bulk_delete_all_gcps_without_permission(self):
        self.api_authentication(self.user)
        all_gcps = self.iteration_dataset_wgs84.gcps.all()
        all_gcp_ids = all_gcps.values_list("id", flat=True)

        response = self.client.post(
            reverse("gcps-bulk_delete"),
            data={
                "gcp_ids": all_gcp_ids,
                "iteration_dataset": str(self.iteration_dataset_wgs84.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)
