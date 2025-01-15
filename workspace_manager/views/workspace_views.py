from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from iteration_manager.models import Iteration
from layer_manager.models import Layer
from shared.exception_handling import ApiErrors

from ..models import Workspace, WorkspaceLayer
from ..permissions import HasCreateWorkspacePermission, HasGetWorkspacePermission
from ..serializers import (
    RetrieveSelectedIterationSerializer,
    RetrieveTerrainIterationSerializer,
    RetrieveTerrainSiteSerializer,
    RetrieveWorkspaceDsmLayerSerializer,
    RetrieveWorkspaceLayersSerializer,
    RetrieveWorkspaceProjectSerializer,
    RetrieveWorkspaceSiteSerializer,
    WorkspaceSerializer,
)


class WorkspaceViewSet(viewsets.ViewSet):
    serializer_class = WorkspaceSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "slug"

    def get_permissions(self):
        if self.action == "create":
            self.permission_classes = (HasCreateWorkspacePermission,)
        elif self.action == "retrieve":
            self.permission_classes = (HasGetWorkspacePermission,)
        return super().get_permissions()

    def get_object(self, slug):
        try:
            workspace = get_object_or_404(Workspace, slug=slug)
        except:
            raise NotFound(ApiErrors.INVALID_LINK.value)
        self.check_object_permissions(self.request, workspace)
        return workspace

    def create(self, request):
        data = request.data.copy()
        data["created_by"] = request.user.id
        serializer = WorkspaceSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        workspace = serializer.save()

        response = {
            "message": "Workspace created successfully.",
            "data": {"slug": workspace.slug},
        }
        return Response(response, status=status.HTTP_201_CREATED)

    def retrieve(self, request, slug=None):
        workspace = self.get_object(slug)

        project_serializer = RetrieveWorkspaceProjectSerializer(workspace.project)

        selected_site = (
            workspace.selected_iteration.site if workspace.selected_iteration else None
        )

        selected_site_serializer = RetrieveWorkspaceSiteSerializer(
            selected_site, context={"user": request.user}
        )

        terrain_site = (
            selected_site
            if workspace.selected_iteration == workspace.terrain_iteration
            else (
                workspace.terrain_iteration.site
                if workspace.terrain_iteration
                else None
            )
        )

        terrain_site_serializer = RetrieveTerrainSiteSerializer(terrain_site)

        selected_iteration_serializer = RetrieveSelectedIterationSerializer(
            workspace.selected_iteration
        )
        terrain_iteration_serializer = RetrieveTerrainIterationSerializer(
            workspace.terrain_iteration
        )

        workspace_layers = WorkspaceLayer.objects.filter(workspace__slug=slug)
        workspace_layer_ids = workspace_layers.values_list("layer_id", flat=True)
        layers = Layer.objects.filter(id__in=workspace_layer_ids)
        workspace_layers_serializer = RetrieveWorkspaceLayersSerializer(
            layers,
            context={"workspace_id": workspace.id, "user": request.user},
            many=True,
        )

        workspace_dsm_iteration_ids = workspace_layers.values_list(
            "dsm_iteration_id", flat=True
        )
        dsm_iterations = Iteration.objects.filter(id__in=workspace_dsm_iteration_ids)
        dsm_layer_serializer = RetrieveWorkspaceDsmLayerSerializer(
            dsm_iterations,
            many=True,
            context={"workspace_id": workspace.id, "user": request.user},
        )

        response = {
            "message": "Workspace fetched successfully.",
            "data": {
                "project": project_serializer.data,
                "selected_site": selected_site_serializer.data,
                "terrain_site": terrain_site_serializer.data,
                "selected_iteration": selected_iteration_serializer.data,
                "terrain_iteration": terrain_iteration_serializer.data,
                "camera": {
                    "latitude": workspace.camera_latitude,
                    "longitude": workspace.camera_longitude,
                    "height": workspace.camera_height,
                    "heading": workspace.camera_heading,
                    "pitch": workspace.camera_pitch,
                    "roll": workspace.camera_roll,
                },
                "workspace_layers": workspace_layers_serializer.data,
                "dsm_layers": dsm_layer_serializer.data,
            },
        }
        return Response(response)
