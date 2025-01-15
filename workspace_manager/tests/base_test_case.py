from shared.tests import BaseTestCase

from ..constants import HaulRoadLayerType
from ..models import HaulRoad, HaulRoadLayer, HaulRoadType, Workspace, WorkspaceLayer


class WorkspaceBaseTestCase(BaseTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.workspace = Workspace.objects.create(
            project=cls.project,
            selected_iteration=cls.iteration,
            terrain_iteration=cls.iteration,
            camera_latitude=1,
            camera_longitude=1,
            camera_height=1,
            camera_heading=1,
            camera_pitch=1,
            camera_roll=1,
            created_by=cls.user,
        )
        cls.workspace_layer = WorkspaceLayer.objects.create(
            layer=cls.layer,
            workspace=cls.workspace,
            show=True,
            z_index=1,
        )

        cls.haul_road_type = HaulRoadType.objects.create(name="main", org=cls.org)
        cls.haul_road = HaulRoad.objects.create(
            name="New Haul",
            type=cls.haul_road_type,
            vehicle_width=10,
            chainage_interval=5,
            iteration=cls.iteration,
            created_by=cls.user,
            updated_by=cls.user,
        )
        cls.haul_road_layer = HaulRoadLayer.objects.create(
            layer=cls.layer,
            haul_road=cls.haul_road,
            type=HaulRoadLayerType.EDGES.value,
        )
