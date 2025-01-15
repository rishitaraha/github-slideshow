import json
from typing import List, Union
from uuid import uuid4

from django.db import models
from django.template.loader import render_to_string
from django.templatetags.static import static
from django_softdelete.models import (
    DeletedManager,
    SoftDeleteManager,
    SoftDeleteModel,
    SoftDeleteQuerySet,
)
from rest_framework.exceptions import ValidationError

from assets import AssetPath
from iteration_manager.models import Iteration
from rainbow.env_variables import EnvVariable
from shared.constants import FileStatus, FileType
from shared.exception_handling import ValidationErrors
from shared.helpers import get_files_status
from shared.models import BaseModel, FileInfo
from site_manager.models import Site
from workspace_manager.constants import HaulRoadLayerType

from ..constants import AreaCategory, ClampToTerrainStatus, LayerType
from ..managers import LayerManager
from .access_tag_models import AccessTag


class Layer(BaseModel, SoftDeleteModel):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid4)
    name = models.CharField(max_length=100)
    iteration = models.ForeignKey(
        Iteration, on_delete=models.DO_NOTHING, related_name="layers"
    )
    site = models.ForeignKey(
        Site, on_delete=models.DO_NOTHING, null=True, related_name="layers"
    )
    type = models.CharField(choices=LayerType.choices(), max_length=100)
    source_id = models.CharField(max_length=100, null=True)
    access_tags = models.ManyToManyField(AccessTag, related_name="layers", blank=True)
    area_category = models.CharField(
        choices=AreaCategory.choices(),
        max_length=100,
        default=AreaCategory.OTHER.value,
    )
    properties = models.JSONField(null=True)
    features_styles = models.JSONField(null=True)
    clamped_status = models.CharField(
        choices=ClampToTerrainStatus.choices(),
        default=ClampToTerrainStatus.NOT_CLAMPED.value,
        max_length=50,
    )

    # Managers.
    objects = LayerManager()
    deleted_objects = DeletedManager()

    # Properties.
    @property
    def files(self) -> Union[List[FileInfo], None]:
        return self.layer_files.filter(
            file_info__is_folder=False,
            file_info__is_deleted=False,
            is_deleted=False,
        )

    @property
    def tiles(self) -> FileInfo | None:
        return self.layer_files.filter(
            file_info__type=FileType.VECTOR_TILES.value,
            file_info__is_deleted=False,
            is_deleted=False,
        ).first()

    @property
    def can_edit_features(self) -> bool:
        if hasattr(self, "haulroadlayer"):
            return self.haulroadlayer.can_edit_features

        return self.type == LayerType.VECTOR.value

    def status(self) -> str | None:
        is_layer_not_self_hosted = (
            self.type
            in [
                LayerType.ORTHOMOSAIC.value,
                LayerType.MAPBOX.value,
                LayerType.CESIUM.value,
            ]
            and self.source_id is not None
        )
        if is_layer_not_self_hosted:
            return FileStatus.DONE.value

        files: SoftDeleteQuerySet = FileInfo.objects.select_related("layerfile").filter(
            layerfile__layer=self,
            layerfile__is_deleted=False,
            is_deleted=False,
        )

        """
        In the case of a shape file upload, a FileInfo object exists for the temporary file uploaded by the user.
        Once the features are extracted from that file and stored in the database, the file is deleted.
        Therefore, if any file is attached to the vector layer, it implies that the layer is in progress.
        If there is no file present for a vector layer, it indicates that the vector layer is ready to use.
        """
        if self.type == LayerType.VECTOR.value and files.count() == 0:
            return FileStatus.DONE.value

        return get_files_status(files)

    def mapbox_style_spec(self) -> dict | None:
        """
        Generate and return the Mapbox style specification for a layer.
        """

        template_context = {
            "map_fonts_base_url": EnvVariable.API_ENGINE_DOMAIN.value
            + static("/map_assets/fonts/"),
        }

        match self.type:
            case LayerType.CONTOUR.value:
                template_name = "mapbox_style_specs/contours_style_spec.json"

            case LayerType.VECTOR.value:
                # Get haul road width and gradient layers style according to the risk settings.
                if hasattr(self, "haulroadlayer") and self.haulroadlayer.type in [
                    HaulRoadLayerType.WIDTH_ANALYSIS.value,
                    HaulRoadLayerType.GRADIENT_ANALYSIS.value,
                ]:
                    return self.haulroadlayer.mapbox_style_spec()

                template_name = "mapbox_style_specs/layer_style_spec.json"

                features_styles_dict = (
                    self.features_styles
                    if isinstance(self.features_styles, dict)
                    else json.loads(self.features_styles)
                )
                template_context.update(features_styles_dict)

            case _:
                return None

        style_spec = render_to_string(
            template_name,
            template_context,
        )

        return json.loads(style_spec)

    def save(self, *args, **kwargs):
        self.clean()

        if self.type == LayerType.VECTOR.value and self.features_styles is None:
            with open(AssetPath.FEATURES_STYLE.value, "r") as features_style:
                self.features_styles = json.load(features_style)

        super().save(*args, **kwargs)


class LayerFile(BaseModel, SoftDeleteModel):
    layer = models.ForeignKey(
        Layer, on_delete=models.CASCADE, related_name="layer_files"
    )
    file_info = models.OneToOneField(FileInfo, on_delete=models.DO_NOTHING)

    # Managers.
    objects = SoftDeleteManager()
    deleted_objects = DeletedManager()

    def save(self, *args, **kwargs):
        # Run validations only when a new layer file is being added.
        # Model state ref: https://docs.djangoproject.com/en/4.2/ref/models/instances/#state.
        if self.__getstate__().get("adding"):
            self.clean()

        super().save(*args, **kwargs)

    def clean(self) -> None:
        # Validation of unique layer file type.
        UNIQUE_FILE_TYPES = (
            FileType.CAPTURED_DSM.value,
            FileType.CAPTURED_DSM_COG.value,
            FileType.MBTiles.value,
            FileType.ORTHOMOSAIC.value,
            FileType.ORTHOMOSAIC_COG.value,
            FileType.SLOPE_MAP.value,
            FileType.TERRAIN_TILES.value,
            FileType.VECTOR_TILES.value,
        )

        if (
            self.file_info.type in UNIQUE_FILE_TYPES
            and LayerFile.objects.filter(
                layer=self.layer,
                file_info__type=self.file_info.type,
            ).exists()
        ):
            raise ValidationError(
                ValidationErrors.UNIQUE_LAYER_FILE_TYPE_ALLOWED.value,
            )

        return super().clean()
