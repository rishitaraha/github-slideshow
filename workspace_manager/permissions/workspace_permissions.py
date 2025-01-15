from typing import List, Optional, Union
from uuid import UUID

from django_softdelete.models import SoftDeleteQuerySet
from rest_framework import permissions
from rest_framework.request import Request

from iteration_manager.models import Iteration
from layer_manager.models import Layer
from layer_manager.permissions.layer_permissions import can_manage_layers
from org_manager.validators import validate_org_ownership
from project_manager.models import Project
from project_manager.permissions import has_view_project_permission
from shared.helpers import get_object_or_none, get_object_with_uuid
from site_manager.models.site_models import Site
from site_manager.permissions import has_view_site_permission
from user_manager.models import CustomUser

from ..models import Workspace, WorkspaceLayer


def has_view_permission_for_site(user: CustomUser, site: Site):
    """
    Helper function to check if the user has view permission for the given site.

    Args:
        user (CustomUser): The user for whom the permission is being checked.
        site (Site): The site for which the permission is being checked.

    Returns:
        bool: True if the user has view permission for the site, False otherwise.
    """

    return has_view_site_permission(user, site) if site else False


def get_permitted_project_layers_count(
    user: CustomUser,
    project: Project,
    layers: Optional[List[Union[Layer, dict]]] = None,
):
    """
    Helper function to filter count of layers accessible to a user in the same project based on selected layer IDs.

    Args:
            user (CustomUser): The user for whom the permitted layers are being checked.
            project (Project): The project to which the layers belong.
            layers (Optional[List[Union[Layer, dict]]], optional): A list of layers or dictionaries
                containing layer information. Defaults to None.

        Returns:
            int: The count of layers that are accessible to the user.
    """

    # Check if layers is a list of dictionaries (POST request).
    if isinstance(layers, list) and all(isinstance(layer, dict) for layer in layers):
        layer_ids = []
        dsm_iteration_ids = []

        for layer in layers:
            if layer_id := layer.get("id"):
                layer_ids.append(layer_id)
            elif iteration_id := layer.get("dsm_iteration_id"):
                dsm_iteration_ids.append(iteration_id)

    # Otherwise, assume it's a queryset (GET request).
    elif isinstance(layers, SoftDeleteQuerySet):
        layer_ids = [layer.id for layer in layers]
    else:
        layer_ids = []

    permitted_layers_count = (
        Layer.objects.get_project_layers_for_user(user=user, project=project)
        .filter(id__in=layer_ids)
        .count()
    )

    # HACK: Implement a better permission check of get workspace request.
    if isinstance(layers, SoftDeleteQuerySet):
        return permitted_layers_count
    else:
        return permitted_layers_count + len(dsm_iteration_ids)


def check_workspace_permissions(
    user: CustomUser,
    project: Project,
    selected_iteration_id: UUID,
    terrain_iteration_id: UUID,
    layers: Optional[List[Union[Layer, dict]]] = None,
) -> bool:
    """
    Helper function to check permissions for a workspace creation or retrieval.
    """
    has_project_view_permission = (
        has_view_project_permission(user, project.id) or user.is_org_admin
    )
    if not has_project_view_permission:
        return False

    selected_iteration = (
        get_object_or_none(Iteration, id=selected_iteration_id)
        if selected_iteration_id
        else None
    )

    selected_site = selected_iteration.site if selected_iteration else None
    has_view_selected_site_permission = has_view_permission_for_site(
        user, selected_site
    )

    if selected_site and (
        not has_view_selected_site_permission or selected_site.project != project
    ):
        return False

    if selected_iteration_id == terrain_iteration_id:
        terrain_iteration = selected_iteration
    elif terrain_iteration_id:
        terrain_iteration = get_object_or_none(Iteration, id=terrain_iteration_id)
    else:
        terrain_iteration = None

    if selected_iteration == terrain_iteration:
        terrain_site = selected_site
    elif terrain_iteration:
        terrain_site = terrain_iteration.site
    else:
        terrain_site = None

    if selected_site == terrain_site:
        has_view_terrain_site_permission = has_view_selected_site_permission
    else:
        has_view_terrain_site_permission = has_view_permission_for_site(
            user, terrain_site
        )

    if terrain_site and (
        not has_view_terrain_site_permission or terrain_site.project != project
    ):
        return False

    accessible_layer_ids_count = get_permitted_project_layers_count(
        user, project, layers
    )
    if accessible_layer_ids_count != len(layers or []):
        return False

    return True


class HasCreateWorkspacePermission(permissions.IsAuthenticated):
    def has_permission(self, request: Request, view):
        if not super().has_permission(request, view):
            return False

        project_id = request.data.get("project_id")
        terrain_iteration_id = request.data.get("terrain_iteration_id")
        selected_iteration_id = request.data.get("selected_iteration_id")

        project = get_object_with_uuid(Project, id=project_id)

        validate_org_ownership(request, project, raise_exception=True)

        layers = request.data.get("layers", None)
        return check_workspace_permissions(
            request.user, project, selected_iteration_id, terrain_iteration_id, layers
        )


class HasGetWorkspacePermission(permissions.IsAuthenticated):
    def has_object_permission(self, request: Request, view, workspace: Workspace):
        if not (request.user.is_authenticated):
            return False

        validate_org_ownership(request, workspace.project, raise_exception=True)
        selected_iteration = workspace.selected_iteration
        terrain_iteration = workspace.terrain_iteration
        layers = Layer.objects.filter(
            id__in=WorkspaceLayer.objects.filter(
                workspace__slug=workspace.slug
            ).values_list("layer_id", flat=True)
        )
        terrain_iteration_id = None
        if terrain_iteration:
            terrain_iteration_id = terrain_iteration.id
        selected_iteration_id = None
        if selected_iteration:
            selected_iteration_id = selected_iteration.id
        return check_workspace_permissions(
            request.user,
            workspace.project,
            selected_iteration_id,
            terrain_iteration_id,
            layers,
        )


class HasCreateSmartDetectPermission(permissions.IsAuthenticated):
    def has_permission(self, request: Request, view):

        if not super().has_permission(request, view):
            return False

        if request.user.is_org_admin:
            return True

        iteration = get_object_with_uuid(Iteration, id=request.data.get("iteration"))
        validate_org_ownership(request, iteration, raise_exception=True)
        can_manage_layers(request.user, iteration)
        return can_manage_layers
