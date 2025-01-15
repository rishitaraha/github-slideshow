from rest_framework import serializers

from iteration_manager.models import Iteration
from layer_manager.constants import LayerType
from layer_manager.models import AccessTag, Feature, Layer
from project_manager.models import Project
from shared.serializers import BatchJobSerializer, FileSerializer
from site_manager.models import Site
from site_manager.permissions import has_manage_iterations_and_layers_permission
from user_manager.models import CustomUser

from ..models import Workspace, WorkspaceLayer
from ..serializers import (
    WorkspaceLayerIterationSerializer,
    WorkspaceLayerSerializer,
    WorkspaceLayerSiteSerializer,
)
from .workspace_file_serializer import (
    GetWorkspaceLayerFileInfoSerializer,
    GetWorkspaceLayerFileSerializer,
    SelectedIterationCapturedDsmCogSerializer,
    SelectedIterationCapturedDsmSerializer,
    TerrainIterationCapturedDsmCogSerializer,
    TerrainIterationCapturedDsmSerializer,
)


class CameraConfigSerializer(serializers.Serializer):
    latitude = serializers.DecimalField(
        max_digits=11, decimal_places=8, min_value=-85.05113, max_value=85.05113
    )
    longitude = serializers.DecimalField(
        max_digits=11, decimal_places=8, min_value=-180, max_value=180
    )
    height = serializers.FloatField()
    heading = serializers.FloatField(min_value=0, max_value=360)
    pitch = serializers.FloatField(min_value=-90, max_value=90)
    roll = serializers.FloatField(min_value=-180, max_value=180)


class WorkspaceSerializer(serializers.ModelSerializer):
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), source="project"
    )
    selected_iteration_id = serializers.PrimaryKeyRelatedField(
        queryset=Iteration.objects.all(),
        source="selected_iteration",
        required=False,
    )
    terrain_iteration_id = serializers.PrimaryKeyRelatedField(
        queryset=Iteration.objects.all(),
        source="terrain_iteration",
        required=False,
    )
    created_by = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all())
    layers = WorkspaceLayerSerializer(many=True, allow_null=True)
    camera = CameraConfigSerializer(required=False)

    def create(self, validated_data):
        layers_data = validated_data.pop("layers", None)
        camera_data = validated_data.pop("camera", None)

        if camera_data:
            validated_data["camera_latitude"] = camera_data.get("latitude")
            validated_data["camera_longitude"] = camera_data.get("longitude")
            validated_data["camera_height"] = camera_data.get("height")
            validated_data["camera_heading"] = camera_data.get("heading")
            validated_data["camera_pitch"] = camera_data.get("pitch")
            validated_data["camera_roll"] = camera_data.get("roll")

        workspace = Workspace.objects.create(**validated_data)

        # Creating workspace layers.
        workspace_layer_objects = []

        for layer_data in layers_data:
            workspace_layer = WorkspaceLayer(
                workspace=workspace,
                layer=layer_data.get("id", None),
                dsm_iteration=layer_data.get("dsm_iteration_id", None),
                show=layer_data["show"],
                z_index=layer_data["z_index"],
            )
            workspace_layer_objects.append(workspace_layer)

        WorkspaceLayer.objects.bulk_create(workspace_layer_objects)

        return workspace

    class Meta:
        model = Workspace
        fields = (
            "id",
            "project_id",
            "selected_iteration_id",
            "terrain_iteration_id",
            "camera",
            "created_by",
            "layers",
        )


class RetrieveWorkspaceProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name")


class RetrieveWorkspaceSiteSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    can_manage_iterations_and_layers = serializers.SerializerMethodField(read_only=True)

    def get_can_manage_iterations_and_layers(self, site: Site):
        if user := self.context.get("user"):
            return user.is_org_admin or has_manage_iterations_and_layers_permission(
                user, site
            )

    class Meta:
        model = Site
        fields = (
            "id",
            "name",
            "latitude",
            "longitude",
            "can_manage_iterations_and_layers",
        )


class RetrieveTerrainSiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = ("id", "name")


class RetrieveSelectedIterationSerializer(serializers.ModelSerializer):
    captured_dsm = SelectedIterationCapturedDsmSerializer(read_only=True)
    captured_dsm_cog = SelectedIterationCapturedDsmCogSerializer(read_only=True)

    class Meta:
        model = Iteration
        fields = ("id", "name", "captured_dsm", "captured_dsm_cog")


class RetrieveTerrainIterationSerializer(serializers.ModelSerializer):
    captured_dsm = TerrainIterationCapturedDsmSerializer(read_only=True)
    captured_dsm_cog = TerrainIterationCapturedDsmCogSerializer(read_only=True)
    terrain_tiles = BatchJobSerializer(read_only=True)

    class Meta:
        model = Iteration
        fields = (
            "id",
            "name",
            "date",
            "captured_dsm",
            "captured_dsm_cog",
            "terrain_tiles",
        )


class RetrieveWorkspaceLayersSerializer(serializers.ModelSerializer):
    status = serializers.CharField(read_only=True)
    tiles = GetWorkspaceLayerFileSerializer(source="tiles.file_info", read_only=True)
    files = GetWorkspaceLayerFileInfoSerializer(read_only=True, many=True)
    site = WorkspaceLayerSiteSerializer(read_only=True)
    iteration = WorkspaceLayerIterationSerializer(read_only=True)
    access_tags = serializers.PrimaryKeyRelatedField(
        queryset=AccessTag.objects.all(),
        pk_field=serializers.UUIDField(),
        many=True,
        default=[],
    )
    features_count = serializers.SerializerMethodField()
    properties = serializers.SerializerMethodField()
    z_index = serializers.SerializerMethodField()
    show = serializers.SerializerMethodField()
    can_manage_layers = serializers.SerializerMethodField(read_only=True)
    map_layer_styles = serializers.JSONField(source="mapbox_style_spec")

    def get_can_manage_layers(self, obj):
        """
        Checks if the request user has manage iterations and layers permission.
        """
        user = self.context.get("user")

        if not user:
            return False

        if user.is_org_admin:
            return True

        return has_manage_iterations_and_layers_permission(user, obj.site)

    def get_properties(self, layer: Layer):
        properties = layer.properties or {}

        if "maxZoom" in properties:
            properties["maxzoom"] = properties["maxZoom"]
        if "minZoom" in properties:
            properties["minzoom"] = properties["minZoom"]

        if layer.type == LayerType.VECTOR.value:
            properties["bounds"] = Feature.objects.get_bounds(layer.id)

        return properties

    def get_features_count(self, layer: Layer):
        return Feature.objects.get_feature_count(layer.id)

    def get_z_index(self, layer):
        workspace_layer = WorkspaceLayer.objects.filter(
            layer=layer, workspace_id=self.context["workspace_id"]
        ).first()
        return workspace_layer.z_index

    def get_show(self, layer):
        workspace_layer = WorkspaceLayer.objects.filter(
            layer=layer, workspace_id=self.context["workspace_id"]
        ).first()
        return workspace_layer.show

    class Meta:
        model = Layer
        fields = (
            "id",
            "site",
            "iteration",
            "name",
            "type",
            "status",
            "z_index",
            "show",
            "files",
            "tiles",
            "source_id",
            "properties",
            "access_tags",
            "area_category",
            "features_styles",
            "features_count",
            "created_at",
            "can_manage_layers",
            "can_edit_features",
            "map_layer_styles",
        )
        read_only_fields = ("id", "created_at")


class RetrieveWorkspaceDsmLayerSerializer(serializers.ModelSerializer):
    captured_dsm = FileSerializer(read_only=True)
    captured_dsm_cog = FileSerializer(read_only=True)
    z_index = serializers.SerializerMethodField()
    show = serializers.SerializerMethodField()
    site = WorkspaceLayerSiteSerializer(read_only=True)

    def get_z_index(self, iteration):
        workspace_layer = WorkspaceLayer.objects.filter(
            dsm_iteration=iteration, workspace_id=self.context["workspace_id"]
        ).first()
        return workspace_layer.z_index

    def get_show(self, iteration):
        workspace_layer = WorkspaceLayer.objects.filter(
            dsm_iteration=iteration, workspace_id=self.context["workspace_id"]
        ).first()
        return workspace_layer.show

    class Meta:
        model = Iteration
        fields = (
            "id",
            "name",
            "site",
            "date",
            "captured_dsm",
            "captured_dsm_cog",
            "z_index",
            "show",
        )
