from datetime import datetime
from unittest import mock
from uuid import uuid4

from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from iteration_manager.constants import BaseReference
from iteration_manager.models import HeapBoundary, Iteration
from layer_manager.constants import LayerType
from layer_manager.models import AccessTag, Feature, FeatureImage, Layer
from org_manager.models import Organisation, OrganisationAccessToken
from project_manager.models import Project
from site_manager.constants import SiteType
from site_manager.models import Site, SiteKPI
from user_manager.constants import UserType
from user_manager.models import CustomUser, UserGroup

from ..aws import AwsManager
from ..constants import BatchJobStatus, FileStatus, FileType
from ..models import BatchJob, FileInfo, ImageInfo
from ..tests.constants import WKTGeometry
from .mock import MockedAwsManager


class BaseTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.org = Organisation.objects.create(
            name="Test Org",
            feature_flags={
                "processing": True,
                "mbtiles": True,
                "processing_workflow": True,
                "generate_analytics": True,
                "haul_road_analytics": True,
            },
        )

        cls.org2 = Organisation.objects.create(
            name="Test Org 2",
            feature_flags={
                "processing": True,
                "mbtiles": True,
                "generate_analytics": True,
                "haul_road_analytics": True,
            },
        )

        cls.org_access_token = OrganisationAccessToken.objects.create(org=cls.org)

        # Setup users.
        cls.user = CustomUser.objects.create_user(
            email="testusername@gmail.com",
            password="abcdefGH123#",
            first_name="Test",
            last_name="User",
            org=cls.org,
        )
        cls.user_2 = CustomUser.objects.create_user(
            email="testuser2@gmail.com",
            password="abcdefGH123#",
            first_name="Test",
            last_name="User 2",
            org=cls.org,
        )
        cls.user_of_org2 = CustomUser.objects.create_user(
            email="testuser2_org2@gmail.com",
            password="JyAiEQ*3JcMxypr",
            first_name="other",
            last_name="user",
            org=cls.org2,
        )

        # Org Admin user.
        cls.org_admin = CustomUser.objects.create_user(
            email="org.admin@gmail.com",
            password="JyAiEQ*3JcMxypr",
            first_name="Test",
            last_name="Admin",
            type=UserType.ORG_ADMIN.value,
            org=cls.org,
        )
        cls.support_user = CustomUser.objects.create_user(
            email="support.user@gmail.com",
            password="YyAiEQ*3JcMuypr",
            first_name="Test",
            last_name="Support",
            type=UserType.SUPPORT.value,
        )

        # Setup user group.
        cls.user_group = UserGroup.objects.create(org=cls.org, name="Aus Members")
        cls.user_group.users.add(cls.user)

        cls.user_group_with_manage_iteration = UserGroup.objects.create(
            org=cls.org, name="Aus Members with can manage iteration permission"
        )
        cls.user_group_with_manage_iteration.users.add(cls.user_2)

        cls.project = Project.objects.create(name="Test Project", org=cls.org)
        cls.site = Site.objects.create(
            name="Test Site",
            project=cls.project,
            type=SiteType.MINE_SITE.value,
            latitude=1,
            longitude=1,
            boundary="id",
            base_dsm=FileInfo.objects.create(
                name="base_dsm.tif",
                s3_key="path.tif",
                status=FileStatus.DONE.value,
                org=cls.org,
            ),
        )
        cls.site_production_target = SiteKPI.objects.create(
            site=cls.site,
            year=2022,
            month=2,
            target_overburden_production=777.77,
            target_ore_production=1111.11,
            actual_overburden_production=987.77,
            actual_ore_production=342.11,
        )
        cls.iteration = Iteration.objects.create(
            name="Test Iteration",
            date=datetime.now(),
            site=cls.site,
            captured_dsm=FileInfo.objects.create(
                name="captured_dsm.tif",
                s3_key="path.tif",
                status=FileStatus.DONE.value,
                type=FileType.CAPTURED_DSM.value,
                org=cls.org,
            ),
            captured_dsm_cog=FileInfo.objects.create(
                name="captured_dsm_cog.tif",
                s3_key="path.tif",
                status=FileStatus.DONE.value,
                type=FileType.CAPTURED_DSM_COG.value,
                org=cls.org,
                batch_job=BatchJob.objects.create(
                    job_id=uuid4(),
                    env_variables=[
                        {
                            "name": "OUTPUT_S3_KEY",
                            "value": "OUTPUT_S3_KEY",
                        }
                    ],
                    status=BatchJobStatus.COMPLETED.value,
                ),
            ),
            terrain_tiles=BatchJob.objects.create(
                job_id=uuid4(),
                env_variables=[
                    {
                        "name": "OUTPUT_S3_KEY",
                        "value": "OUTPUT_S3_KEY",
                    }
                ],
                status=BatchJobStatus.COMPLETED.value,
            ),
        )
        cls.heap_boundary = HeapBoundary.objects.create(
            name="Test Heap",
            iteration=cls.iteration,
            geometry=WKTGeometry.MULTIPOLYGON.value,
            remarks="just a test heap",
            bulk_density=12.8,
            centroid=1,
            cut_volume=28.4,
            fill_volume=10,
            net_volume=18.4,
            cut_weight=363.52,
            fill_weight=128,
            net_weight=235.52,
            base_reference=BaseReference.VisibleGround.value,
        )
        cls.layer = Layer.objects.create(
            name="Test Layer",
            iteration=cls.iteration,
            site=cls.site,
            source_id="source id",
            type=LayerType.MAPBOX.value,
        )

        cls.feature = Feature.objects.create(
            name="Test Feature",
            geometry=WKTGeometry.POLYGON.value,
            layer=cls.layer,
            properties={"area": 55.06},
            info="some info",
        )

        cls.access_tag = AccessTag.objects.create(
            name="Access Tag", org=cls.org, color="#ffffff"
        )
        cls.file_info = FileInfo.objects.create(
            name="test.mbtiles",
            org=cls.org,
        )
        cls.user_group.access_tags.add(cls.access_tag)

        cls.org_without_feature_flag = Organisation.objects.create(
            name="Test Org",
            feature_flags={"processing": False, "mbtiles": False},
        )
        cls.org_admin_without_feature_flag = CustomUser.objects.create_user(
            email="test_org.admin@gmail.com",
            password="bLaAD4*BCCqs5xFtjMU5YE",
            first_name="Test feature org",
            last_name="Admin",
            type=UserType.ORG_ADMIN.value,
            org=cls.org_without_feature_flag,
        )

        cls.image_info = ImageInfo.objects.create(
            name="test_image.png",
            image_s3_key="s3-key/image",
            thumbnail_s3_key="s3-key/thumbnail",
        )

        cls.feature_image = FeatureImage.objects.create(
            feature=cls.feature,
            image=cls.image_info,
        )

        # Mocks.
        cls.mocked_submit_batch_job = mock.patch.object(
            AwsManager,
            "submit_batch_job",
            return_value=MockedAwsManager.submit_batch_job(),
        ).start()

        cls.mocked_submit_batch_job = mock.patch.object(
            AwsManager,
            "delete_file",
            return_value=True,
        ).start()

    def api_authentication(self, user=None):
        self.token = RefreshToken.for_user(user or self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token.access_token}")
