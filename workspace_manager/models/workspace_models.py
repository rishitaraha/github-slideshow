from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from iteration_manager.models import Iteration
from layer_manager.models import Layer
from project_manager.models import Project
from shared.models import BaseModel
from user_manager.models import CustomUser

from ..managers import WorkspaceManager


class Workspace(BaseModel):
    project = models.ForeignKey(Project, on_delete=models.DO_NOTHING)
    selected_iteration = models.ForeignKey(
        Iteration,
        on_delete=models.DO_NOTHING,
        related_name="workspaces",
        null=True,
    )
    terrain_iteration = models.ForeignKey(
        Iteration,
        on_delete=models.DO_NOTHING,
        related_name="workspaces_for_terrains",
        null=True,
    )
    camera_latitude = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        validators=[MinValueValidator(-85.05113), MaxValueValidator(85.05113)],
    )
    camera_longitude = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
    )
    camera_height = models.FloatField()
    camera_heading = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(360)]
    )
    camera_pitch = models.FloatField(
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    camera_roll = models.FloatField(
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    slug = models.CharField(max_length=8, unique=True)
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.DO_NOTHING,
    )

    objects = WorkspaceManager()


class WorkspaceLayer(BaseModel):
    layer = models.ForeignKey(
        Layer, on_delete=models.DO_NOTHING, related_name="workspace_layers", null=True
    )
    # HACK: This is the ultimate hack by analytics team. Please remove this with proud after DSM as layer story.
    dsm_iteration = models.ForeignKey(
        Iteration,
        on_delete=models.DO_NOTHING,
        related_name="workspace_dsm_layers",
        null=True,
    )
    workspace = models.ForeignKey(
        Workspace, on_delete=models.DO_NOTHING, related_name="workspace_layers"
    )
    show = models.BooleanField()
    z_index = models.IntegerField()

    class Meta:
        # TODO: Add composite key constrain for layer dsm_iteration and workspace.
        constraints = [
            models.CheckConstraint(
                check=models.Q(layer__isnull=False)
                | models.Q(dsm_iteration__isnull=False),
                name="layer_or_dsm_iteration_required_in_workspace_layer",
            ),
        ]
