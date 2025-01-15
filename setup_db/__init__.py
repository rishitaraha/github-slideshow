from datetime import datetime
from uuid import uuid4
from .enums import FileType, LayerType

from iteration_manager.constants import BaseReference
from iteration_manager.models import HeapBoundary, Iteration
from layer_manager.models import AccessTag, Feature, FeatureImage, Layer, LayerFile
from org_manager.models import Organisation, OrganisationAccessToken
from project_manager.models import Project
from site_manager.constants import SiteType
from site_manager.models import Site, SiteKPI
from user_manager.constants import UserType
from user_manager.models import CustomUser, UserGroup

from shared.constants import BatchJobStatus, FileStatus
from shared.models import BatchJob, FileInfo, ImageInfo
from shared.tests.constants import WKTGeometry

s3_bucket_name = "ac-e2e-test-dev"

def create_site(
    site_name: str,
    project: Project,
    latitude: float = 1.0,
    longitude: float = 1.0,
    boundary: str = "id",
):
    site = Site.objects.create(
        name=site_name,
        project=project,
        type=SiteType.MINE_SITE.value,
        latitude=latitude,
        longitude=longitude,
        boundary=boundary,
    )
    site_production_target = SiteKPI.objects.create(
        site=site,
        year=2022,
        month=2,
        target_overburden_production=777.77,
        target_ore_production=1111.11,
        actual_overburden_production=987.77,
        actual_ore_production=342.11,
    )
    return site


def create_iteration(iteration_name: str, site: Site):
    iteration = Iteration.objects.create(
        name=iteration_name,
        date=datetime.now(),
        site=site,
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
    heap_boundary = HeapBoundary.objects.create(
        name="Test Heap",
        iteration=iteration,
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
    return iteration


def create_iteration_with_file(iteration_name: str, site: Site, id: str, s3_key:str):
    """
    Creates and returns a new Iteration object linked to a BatchJob with the specified name, site, unique ID, and S3 output key.
    """
    iteration = Iteration.objects.create(
        id=id,
        name=iteration_name,
        date=datetime.now(),
        site=site,
        terrain_tiles=BatchJob.objects.create(
            job_id=uuid4(),
            env_variables=[
                {
                    "name": "OUTPUT_S3_KEY",
                    "value": s3_key,
                }
            ],
            status=BatchJobStatus.COMPLETED.value,
        ),
    )
    return iteration


def create_layer(
    layer_name: str, iteration: Iteration, site: Site, source_id: str = "source id"
):
    layer = Layer.objects.create(
        name=layer_name,
        iteration=iteration,
        site=site,
        source_id=source_id,
        type=LayerType.MAPBOX.value,
    )
    return layer


def create_layer_with_file(
    layer_name: str,
    iteration: Iteration,
    site: Site,
    file_name: str,
    file_type: str,
    layer_type: str,
    s3_key: str,
):
    """
    This function returns a new Layer associated with a FileInfo object and link them using the provided S3 key.
    """
    file_info = FileInfo.objects.create(
        id=uuid4(),
        name=file_name,
        bucket_name=s3_bucket_name,
        s3_key=s3_key,
        status=FileStatus.DONE.value,
        type=file_type,
    )

    layer = Layer.objects.create(
        name=layer_name,
        iteration=iteration,
        site=site,
        type=layer_type,
    )

    LayerFile.objects.create(layer=layer, file_info=file_info)
    return layer


def setup():
    already_created = Organisation.objects.filter(name="Test Org")
    if not already_created:
        org = Organisation.objects.create(
            name="Test Org",
            feature_flags={
                "processing": True,
                "mbtiles": True,
                "generate_analytics": True,
            },
        )
        org_access_token = OrganisationAccessToken.objects.create(org=org)
        user = CustomUser.objects.create_user(
            email="testusername@gmail.com",
            password="4y^yGQboE9vpDPHrMtst",
            first_name="Test",
            last_name="User",
            org=org,
        )
        org_admin = CustomUser.objects.create_user(
            email="org.admin@gmail.com",
            password="4y^yGQboE9vpDPHrMtst",
            first_name="Test",
            last_name="Admin",
            type=UserType.ORG_ADMIN.value,
            org=org,
        )

        # Setup user group.
        user_group = UserGroup.objects.create(org=org, name="Aus Members")
        user_group.users.add(user)

        # Projects.
        project1 = Project.objects.create(name="Test Project", org=org)
        project2 = Project.objects.create(name="Test iteration Project-1", org=org)
        project3 = Project.objects.create(name="Test layer Project-1", org=org)
        cesium_project = Project.objects.create(name="Cesium Project", org=org)

        # Sites.
        # Pagination.
        for i in range(1, 110):
            create_site(f"Test Site-{i}", project1)

        site1 = create_site("Test Site-1", project2)
        site2 = create_site("Test Site-2", project2)
        create_site("Test Site-3", project2)
        site3 = create_site("Test Site-1", project3)
        cesium_site1 = create_site(
            "Test cesium Site-1", cesium_project, 23.807739, 87.018801
        )

        # Iterations.
        create_iteration("Test Iteration-1", site1)
        create_iteration("Test Iteration-2", site1)
        create_iteration("Test Iteration-3", site1)
        # Pagination.
        for i in range(1, 110):
            create_iteration(f"Test Iteration-{i}", site2)

        iteration1 = create_iteration("Test Iteration-1", site3)
        iteration2 = create_iteration("Test Iteration-2", site3)
        create_iteration("Test Iteration-3", site3)
        cesium_iteration1 = create_iteration_with_file(
            "Test cesium Iteration-1",
            cesium_site1,
            id="da0cc1ac-c7e6-4358-8391-2c9b997ec32d",
            s3_key=f"{s3_bucket_name}/terrain_tiles/da0cc1ac-c7e6-4358-8391-2c9b997ec32d_tt",
        )

        # Layers.
        create_layer("Test layer-2", iteration1, site3)
        create_layer("Test layer-1", iteration1, site3)
        # Pagination.
        for i in range(1, 110):
            create_layer(f"Test layer-{i}", iteration2, site3)

        cesium_layer1 = create_layer_with_file(
            "Test cesium layer-1",
            cesium_iteration1,
            cesium_site1,
            "test_ortho.tif",
            FileType.ORTHOMOSAIC.value,
            LayerType.ORTHOMOSAIC.value,
            s3_key="orthomosaic/5c510137-871f-4a95-a4cf-6137431ec266.tif",
        )
        create_layer_with_file(
            "Test cesium layer-2",
            cesium_iteration1,
            cesium_site1,
            "ortho_cog.tif",
            FileType.ORTHOMOSAIC_COG.value,
            LayerType.ORTHOMOSAIC.value,
            s3_key="orthomosaic_cog/91ecb8b4-2015-4154-838b-41aa1c2c7fcb.tif",
        )

        feature = Feature.objects.create(
            name="Test Feature",
            geometry=WKTGeometry.POLYGON.value,
            layer=cesium_layer1,
            properties={"area": 55.06},
            info="some info",
        )
        access_tag = AccessTag.objects.create(
            name="Access Tag", org=org, color="#ffffff"
        )
        file_info = FileInfo.objects.create(
            name="test.mbtiles",
            org=org,
        )
        user_group.access_tags.add(access_tag)

        org_without_feature_flag = Organisation.objects.create(
            name="Test Org",
            feature_flags={"processing": False, "mbtiles": False},
        )
        org_admin_without_feature_flag = CustomUser.objects.create_user(
            email="test_org.admin@gmail.com",
            password="4y^yGQboE9vpDPHrMtst",
            first_name="Test feature org",
            last_name="Admin",
            type=UserType.ORG_ADMIN.value,
            org=org_without_feature_flag,
        )

        image_info = ImageInfo.objects.create(
            name="test_image.png",
            image_s3_key="s3-key/image",
            thumbnail_s3_key="s3-key/thumbnail",
        )

        feature_image = FeatureImage.objects.create(
            feature=feature,
            image=image_info,
        )
